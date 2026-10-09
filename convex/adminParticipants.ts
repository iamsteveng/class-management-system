import { v } from "convex/values";

import { canSelfChange, sessionStartsAt } from "./changeCutoff";
import { applyParticipantSessionChange } from "./participants";
import { serverMutation, serverQuery } from "./serverOnly";
import { remainingQuotaBySession } from "./remainingQuota";

export const getAvailableSessionsForClassChange = serverQuery({
  args: {
    class_id: v.string(),
    current_session_id: v.string(),
  },
  returns: v.array(
    v.object({
      session_id: v.string(),
      date: v.string(),
      time: v.string(),
      location_zh: v.string(),
      location_en: v.optional(v.string()),
      quota_available: v.number(),
      hidden: v.boolean(),
    })
  ),
  handler: async (ctx, args) => {
    const sessions = await ctx.db
      .query("sessions")
      .withIndex("by_class_id", (q) => q.eq("class_id", args.class_id))
      .collect();

    const remaining = await remainingQuotaBySession(ctx.db, sessions);
    const now = Date.now();

    return sessions
      .filter(
        (s) =>
          s.session_id !== args.current_session_id &&
          s.status === "scheduled" &&
          sessionStartsAt(s) > now &&
          (remaining.get(s.session_id) ?? 0) > 0
      )
      .map((s) => ({
        session_id: s.session_id,
        date: s.date,
        time: s.time,
        location_zh: s.location_zh ?? "",
        location_en: s.location_en,
        quota_available: remaining.get(s.session_id) ?? 0,
        hidden: s.hidden === true,
      }))
      .sort((a, b) => `${a.date}T${a.time}`.localeCompare(`${b.date}T${b.time}`));
  },
});

/**
 * Super Admin move of a Participant to another Session. Unlike self-service, Hidden
 * Sessions are allowed, and so is a move past the Change Cutoff, which needs a reason.
 */
export const changeParticipantSession = serverMutation({
  args: {
    participant_id: v.string(),
    session_id: v.string(),
    admin_username: v.string(),
    reason: v.optional(v.string()),
  },
  returns: v.object({
    success: v.boolean(),
    error_message: v.optional(v.string()),
  }),
  handler: async (ctx, args) => {
    const admin = await ctx.db
      .query("admins")
      .withIndex("by_username", (q) => q.eq("username", args.admin_username))
      .first();

    if (!admin || admin.role !== "super_admin") {
      return { success: false, error_message: "Only super admins can change a participant's session." };
    }

    return applyParticipantSessionChange(
      ctx,
      { participant_id: args.participant_id, session_id: args.session_id },
      { allowHiddenSession: true, adminId: admin._id, superAdminOverride: { reason: args.reason } }
    );
  },
});

export const getParticipantAdminDetails = serverQuery({
  args: {
    participant_id: v.string(),
  },
  returns: v.union(
    v.null(),
    v.object({
      participant_id: v.string(),
      name: v.optional(v.string()),
      mobile: v.optional(v.string()),
      email: v.optional(v.string()),
      session_id: v.string(),
      class_id: v.string(),
      session_location: v.string(),
      session_date: v.string(),
      session_time: v.string(),
      class_name: v.string(),
      terms_accepted_at: v.optional(v.number()),
      terms_version: v.optional(v.string()),
      height: v.optional(v.float64()),
      age: v.optional(v.number()),
      emergency_contact_name: v.optional(v.string()),
      emergency_contact_phone: v.optional(v.string()),
      riding_experience: v.optional(v.string()),
      health_notes: v.optional(v.string()),
      photo_consent: v.optional(v.boolean()),
      terms_accepted_by: v.optional(v.string()),
      past_change_cutoff: v.boolean(),
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

    let termsVersion: string | undefined;
    if (participant.terms_version_id) {
      const tv = await ctx.db.get(participant.terms_version_id);
      termsVersion = tv?.version;
    }

    return {
      participant_id: participant.participant_id,
      name: participant.name,
      mobile: participant.mobile,
      email: participant.email,
      session_id: session.session_id,
      class_id: session.class_id,
      session_location: session.location_zh ?? "",
      session_date: session.date,
      session_time: session.time,
      class_name: classRecord?.name_zh ?? "Unknown class",
      terms_accepted_at: participant.terms_accepted_at,
      terms_version: termsVersion,
      height: participant.height,
      age: participant.age,
      emergency_contact_name: participant.emergency_contact_name,
      emergency_contact_phone: participant.emergency_contact_phone,
      riding_experience: participant.riding_experience,
      health_notes: participant.health_notes,
      photo_consent: participant.photo_consent,
      terms_accepted_by: participant.terms_accepted_by,
      past_change_cutoff: !canSelfChange(session, Date.now()),
    };
  },
});

/**
 * A Participant's history for admins: every Scan (with the Session it was at, even if
 * they have since moved) and every Session change, with who made it and why.
 */
export const getParticipantHistory = serverQuery({
  args: { participant_id: v.string() },
  returns: v.array(
    v.object({
      kind: v.union(v.literal("scan"), v.literal("move")),
      at: v.number(),
      admin_username: v.optional(v.string()),
      session_label: v.string(),
      to_session_label: v.optional(v.string()),
      past_cutoff: v.optional(v.boolean()),
      reason: v.optional(v.string()),
    })
  ),
  handler: async (ctx, args) => {
    const [scans, logs, admins] = await Promise.all([
      ctx.db
        .query("attendance_records")
        .withIndex("by_participant_id", (q) => q.eq("participant_id", args.participant_id))
        .collect(),
      ctx.db
        .query("audit_logs")
        .withIndex("by_entity", (q) => q.eq("entity_type", "participant").eq("entity_id", args.participant_id))
        .collect(),
      ctx.db.query("admins").collect(),
    ]);
    const adminName = new Map(admins.map((a) => [a._id, a.username]));
    const labels = new Map<string, string>();
    const label = async (sessionId: string) => {
      if (!labels.has(sessionId)) {
        const s = await ctx.db
          .query("sessions")
          .withIndex("by_session_id", (q) => q.eq("session_id", sessionId))
          .first();
        labels.set(sessionId, s ? `${s.date} ${s.time} ${s.location_zh ?? ""}`.trim() : sessionId);
      }
      return labels.get(sessionId)!;
    };

    const history = [];
    for (const scan of scans) {
      history.push({
        kind: "scan" as const,
        at: scan.marked_at,
        admin_username: adminName.get(scan.marked_by_admin),
        session_label: await label(scan.session_id),
      });
    }
    for (const log of logs.filter((l) => l.action === "participant_session_changed")) {
      const meta = (log.metadata ?? {}) as {
        previous_session_id?: string;
        next_session_id?: string;
        past_cutoff?: boolean;
        override_reason?: string;
      };
      history.push({
        kind: "move" as const,
        at: log.created_at,
        admin_username: log.admin_id ? adminName.get(log.admin_id) : undefined,
        session_label: meta.previous_session_id ? await label(meta.previous_session_id) : "",
        to_session_label: meta.next_session_id ? await label(meta.next_session_id) : undefined,
        past_cutoff: meta.past_cutoff,
        reason: meta.override_reason,
      });
    }
    return history.sort((a, b) => a.at - b.at);
  },
});

