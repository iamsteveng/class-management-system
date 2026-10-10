import { makeFunctionReference, mutationGeneric, queryGeneric, type GenericMutationCtx, internalQueryGeneric } from "convex/server";

import type { DataModel, Id } from "./_generated/dataModel";
import { v } from "convex/values";

import { canSelfChange, OVERRIDE_REASON_MIN, sessionStartsAt } from "./changeCutoff";
import { remainingQuota, remainingQuotaBySession } from "./remainingQuota";

export const getParticipantPageData = queryGeneric({
  args: {
    participant_id: v.string(),
  },
  returns: v.union(
    v.null(),
    v.object({
      participant_id: v.string(),
      participant_name: v.string(),
      session_id: v.string(),
      session_location: v.string(),
      session_location_en: v.optional(v.string()),
      session_end_time: v.optional(v.string()),
      session_date: v.string(),
      session_time: v.string(),
      session_google_maps_url: v.optional(v.string()),
      class_name: v.string(),
      class_name_en: v.optional(v.string()),
      qr_code_data: v.string(),
      can_change_session: v.boolean(),
      is_rain_cancelled: v.boolean(),
      mobile: v.optional(v.string()),
      email: v.optional(v.string()),
      height: v.optional(v.float64()),
      age: v.optional(v.number()),
      emergency_contact_name: v.optional(v.string()),
      emergency_contact_phone: v.optional(v.string()),
      terms_version: v.optional(v.string()),
      terms_content: v.optional(v.string()),
      session_options: v.array(
        v.object({
          session_id: v.string(),
          location_zh: v.string(),
          location_en: v.optional(v.string()),
          end_time: v.optional(v.string()),
          date: v.string(),
          time: v.string(),
          available_quota: v.number(),
        })
      ),
    })
  ),
  handler: async (ctx, args) => {
    const participant = await ctx.db
      .query("participants")
      .withIndex("by_participant_id", (q) =>
        q.eq("participant_id", args.participant_id)
      )
      .first();

    if (!participant) {
      return null;
    }

    const session = await ctx.db
      .query("sessions")
      .withIndex("by_session_id", (q) => q.eq("session_id", participant.session_id))
      .first();

    if (!session) {
      return null;
    }

    const classRecord = await ctx.db
      .query("classes")
      .withIndex("by_class_id", (q) => q.eq("class_id", session.class_id))
      .first();

    if (!classRecord) {
      return null;
    }

    const isRainCancelled = session.cancellation_reason === "rain";
    const canChangeSession = canSelfChange(session, Date.now()) || isRainCancelled;

    const now = new Date();
    const classSessions = canChangeSession
      ? await ctx.db
          .query("sessions")
          .withIndex("by_class_id", (q) => q.eq("class_id", session.class_id))
          .collect()
      : [];
    const remaining = await remainingQuotaBySession(ctx.db, classSessions);
    const availableOptions = canChangeSession
      ? classSessions
          .filter((candidateSession) => {
            const availableQuota = remaining.get(candidateSession.session_id) ?? 0;
            const isFutureSession = sessionStartsAt(candidateSession) > now.getTime();
            return (
              candidateSession.status === "scheduled" &&
              candidateSession.hidden !== true &&
              candidateSession.session_id !== session.session_id &&
              availableQuota > 0 &&
              isFutureSession
            );
          })
          .map((candidateSession) => ({
            session_id: candidateSession.session_id,
            location_zh: candidateSession.location_zh ?? "",
            location_en: candidateSession.location_en,
            end_time: candidateSession.end_time,
            date: candidateSession.date,
            time: candidateSession.time,
            available_quota: remaining.get(candidateSession.session_id) ?? 0,
          }))
          .sort((left, right) =>
            `${left.date}T${left.time}`.localeCompare(`${right.date}T${right.time}`)
          )
      : [];

    let terms_version: string | undefined;
    let terms_content: string | undefined;
    if (participant.terms_version_id) {
      const termsVersionDoc = await ctx.db.get(participant.terms_version_id);
      if (termsVersionDoc) {
        terms_version = termsVersionDoc.version;
        terms_content = termsVersionDoc.content;
      }
    }

    return {
      participant_id: participant.participant_id,
      participant_name: participant.name?.trim() || "Participant",
      session_id: session.session_id,
      session_location: session.location_zh ?? "",
      session_location_en: session.location_en,
      session_end_time: session.end_time,
      session_date: session.date,
      session_time: session.time,
      session_google_maps_url: session.google_maps_url,
      class_name: classRecord.name_zh ?? "",
      class_name_en: classRecord.name_en,
      qr_code_data: participant.qr_code_data ?? participant.participant_id,
      can_change_session: canChangeSession,
      is_rain_cancelled: isRainCancelled,
      mobile: participant.mobile,
      email: participant.email,
      height: participant.height,
      age: participant.age,
      emergency_contact_name: participant.emergency_contact_name,
      emergency_contact_phone: participant.emergency_contact_phone,
      terms_version,
      terms_content,
      session_options: availableOptions,
    };
  },
});

/** Self-service Session change, authorised by the Participant Link. Never into a Hidden Session. */
export const changeParticipantSession = mutationGeneric({
  args: {
    participant_id: v.string(),
    session_id: v.string(),
  },
  returns: v.object({
    success: v.boolean(),
    error_message: v.optional(v.string()),
  }),
  handler: async (ctx, args) =>
    applyParticipantSessionChange(ctx, args, { allowHiddenSession: false }),
});

/**
 * Moves a Participant to another Session of the same Class. Shared by the self-service
 * change and the admin move. Participants are held to the Change Cutoff; a Super Admin
 * may move someone past it (even after their Session, scanned or not) but must give a
 * reason. Only an admin move may target a Hidden Session. Nobody is moved into a Session
 * that has started, is not scheduled, or has no Remaining Quota.
 */
export async function applyParticipantSessionChange(
  ctx: GenericMutationCtx<DataModel>,
  args: { participant_id: string; session_id: string },
  options: {
    allowHiddenSession: boolean;
    adminId?: Id<"admins">;
    /** Set for a Super Admin move: may pass the Change Cutoff, with a reason. */
    superAdminOverride?: { reason?: string };
  }
): Promise<{ success: boolean; error_message?: string }> {
  const participant = await ctx.db
    .query("participants")
    .withIndex("by_participant_id", (q) => q.eq("participant_id", args.participant_id))
    .first();

  if (!participant) {
    return {
      success: false,
      error_message: "Participant was not found.",
    };
  }

  const currentSession = await ctx.db
    .query("sessions")
    .withIndex("by_session_id", (q) => q.eq("session_id", participant.session_id))
    .first();

  if (!currentSession) {
    return {
      success: false,
      error_message: "Current session is not available.",
    };
  }

  const now = Date.now();
  const pastCutoff = !canSelfChange(currentSession, now);
  const reason = options.superAdminOverride?.reason?.trim() ?? "";
  if (pastCutoff) {
    if (!options.superAdminOverride) {
      return {
        success: false,
        error_message:
          "Session changes are only allowed until 00:00 two days before the class date.",
      };
    }
    if (reason.length < OVERRIDE_REASON_MIN) {
      return {
        success: false,
        error_message: "This participant is past the Change Cutoff. Please give a reason for the move.",
      };
    }
  }

  const newSession = await ctx.db
    .query("sessions")
    .withIndex("by_session_id", (q) => q.eq("session_id", args.session_id))
    .first();

  if (
    !newSession ||
    newSession.status !== "scheduled" ||
    sessionStartsAt(newSession) <= now ||
    (newSession.hidden === true && !options.allowHiddenSession)
  ) {
    return {
      success: false,
      error_message: "Selected session is not available.",
    };
  }

  if (newSession.class_id !== currentSession.class_id) {
    return {
      success: false,
      error_message: "You can only switch to another session of the same class.",
    };
  }

  if (newSession.session_id === currentSession.session_id) {
    return { success: true };
  }

  const newSessionAvailable = await remainingQuota(ctx.db, newSession);
  if (newSessionAvailable < 1) {
    return {
      success: false,
      error_message: "Selected session is already full.",
    };
  }

  const changedAt = now;

  await ctx.db.patch(participant._id, {
    session_id: newSession.session_id,
  });

  await ctx.db.patch(currentSession._id, {
    quota_used: Math.max(0, currentSession.quota_used - 1),
  });

  await ctx.db.patch(newSession._id, {
    quota_used: newSession.quota_used + 1,
  });

  await ctx.db.insert("audit_logs", {
    admin_id: options.adminId,
    action: "participant_session_changed",
    entity_type: "participant",
    entity_id: participant.participant_id,
    metadata: {
      previous_session_id: currentSession.session_id,
      next_session_id: newSession.session_id,
      changed_at: changedAt,
      past_cutoff: pastCutoff,
      ...(pastCutoff ? { override_reason: reason } : {}),
    },
    created_at: changedAt,
  });

  return { success: true };
}

/** What a Participant's rain-cancellation WhatsApp needs; internal only. */
export const getRainNoticeDetails = internalQueryGeneric({
  args: {
    participant_id: v.string(),
  },
  returns: v.union(
    v.null(),
    v.object({
      mobile: v.union(v.string(), v.null()),
      class_name_zh: v.string(),
      session_date: v.string(),
      session_time: v.string(),
      session_end_time: v.optional(v.string()),
      session_location_zh: v.string(),
    })
  ),
  handler: async (ctx, args) => {
    const participant = await ctx.db
      .query("participants")
      .withIndex("by_participant_id", (q) => q.eq("participant_id", args.participant_id))
      .first();
    if (!participant) return null;
    const session = await ctx.db
      .query("sessions")
      .withIndex("by_session_id", (q) => q.eq("session_id", participant.session_id))
      .first();
    const cls = session
      ? await ctx.db
          .query("classes")
          .withIndex("by_class_id", (q) => q.eq("class_id", session.class_id))
          .first()
      : null;
    return {
      mobile: participant.mobile ?? null,
      class_name_zh: cls?.name_zh ?? "",
      session_date: session?.date ?? "",
      session_time: session?.time ?? "",
      session_end_time: session?.end_time,
      session_location_zh: session?.location_zh ?? "",
    };
  },
});
