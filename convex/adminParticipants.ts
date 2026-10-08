import { mutationGeneric, queryGeneric } from "convex/server";
import { v } from "convex/values";

import { applyParticipantSessionChange } from "./participants";
import { remainingQuotaBySession } from "./remainingQuota";

export const getAvailableSessionsForClassChange = queryGeneric({
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

    return sessions
      .filter(
        (s) =>
          s.session_id !== args.current_session_id &&
          s.status === "scheduled" &&
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

/** Super Admin move of a Participant to another Session; unlike self-service, Hidden Sessions are allowed. */
export const changeParticipantSession = mutationGeneric({
  args: {
    participant_id: v.string(),
    session_id: v.string(),
    admin_username: v.string(),
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
      { allowHiddenSession: true, adminId: admin._id }
    );
  },
});

export const getParticipantAdminDetails = queryGeneric({
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
    };
  },
});
