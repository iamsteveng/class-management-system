import { makeFunctionReference, mutationGeneric, queryGeneric } from "convex/server";
import { v } from "convex/values";

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

    const canChangeSession = isMoreThanTwoDaysAway(session.date, session.time);

    const now = new Date();
    const availableOptions = canChangeSession
      ? (
          await ctx.db
            .query("sessions")
            .withIndex("by_class_id", (q) => q.eq("class_id", session.class_id))
            .collect()
        )
          .filter((candidateSession) => {
            const availableQuota =
              candidateSession.quota_defined - candidateSession.quota_used;
            return (
              candidateSession.status === "scheduled" &&
              candidateSession.session_id !== session.session_id &&
              availableQuota > 0 &&
              new Date(`${candidateSession.date}T${candidateSession.time}`) > now
            );
          })
          .map((candidateSession) => ({
            session_id: candidateSession.session_id,
            location_zh: candidateSession.location_zh ?? "",
            location_en: candidateSession.location_en,
            end_time: candidateSession.end_time,
            date: candidateSession.date,
            time: candidateSession.time,
            available_quota:
              candidateSession.quota_defined - candidateSession.quota_used,
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

export const changeParticipantSession = mutationGeneric({
  args: {
    participant_id: v.string(),
    session_id: v.string(),
  },
  returns: v.object({
    success: v.boolean(),
    error_message: v.optional(v.string()),
  }),
  handler: async (ctx, args) => {
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

    if (!isMoreThanTwoDaysAway(currentSession.date, currentSession.time)) {
      return {
        success: false,
        error_message:
          "Session changes are only allowed more than 2 days before the class date.",
      };
    }

    const newSession = await ctx.db
      .query("sessions")
      .withIndex("by_session_id", (q) => q.eq("session_id", args.session_id))
      .first();

    if (!newSession || newSession.status !== "scheduled") {
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

    const newSessionAvailable = newSession.quota_defined - newSession.quota_used;
    if (newSessionAvailable < 1) {
      return {
        success: false,
        error_message: "Selected session is already full.",
      };
    }

    const changedAt = Date.now();

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
      action: "participant_session_changed",
      entity_type: "participant",
      entity_id: participant.participant_id,
      metadata: {
        previous_session_id: currentSession.session_id,
        next_session_id: newSession.session_id,
        changed_at: changedAt,
      },
      created_at: changedAt,
    });

    // Look up customer mobile from purchase and schedule WhatsApp notification
    const purchase = await ctx.db.get(participant.purchase_id);
    const customerMobile = purchase?.customer_mobile ?? participant.mobile;
    if (customerMobile) {
      await ctx.scheduler.runAfter(
        0,
        makeFunctionReference<"action">("participantLinks:sendParticipantLinks"),
        {
          customer_mobile: customerMobile,
          participant_ids: [participant.participant_id],
        }
      );
      await ctx.db.insert("audit_logs", {
        action: "whatsapp_notification_sent",
        entity_type: "participant",
        entity_id: participant.participant_id,
        metadata: {
          customer_mobile: customerMobile,
          notification_type: "session_changed",
          session_id: newSession.session_id,
        },
        created_at: changedAt + 1,
      });
    }

    return { success: true };
  },
});

function isMoreThanTwoDaysAway(date: string, time: string): boolean {
  const sessionStartsAt = Date.parse(`${date}T${time}:00`);
  const twoDaysInMs = 2 * 24 * 60 * 60 * 1000;
  return Number.isFinite(sessionStartsAt) && sessionStartsAt - Date.now() > twoDaysInMs;
}
