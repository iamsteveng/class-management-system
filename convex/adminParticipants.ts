import { queryGeneric } from "convex/server";
import { v } from "convex/values";

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
      location: v.string(),
      quota_available: v.number(),
    })
  ),
  handler: async (ctx, args) => {
    const sessions = await ctx.db
      .query("sessions")
      .withIndex("by_class_id", (q) => q.eq("class_id", args.class_id))
      .collect();

    return sessions
      .filter(
        (s) =>
          s.session_id !== args.current_session_id &&
          s.status === "scheduled" &&
          s.quota_used < s.quota_defined
      )
      .map((s) => ({
        session_id: s.session_id,
        date: s.date,
        time: s.time,
        location: s.location,
        quota_available: s.quota_defined - s.quota_used,
      }))
      .sort((a, b) => `${a.date}T${a.time}`.localeCompare(`${b.date}T${b.time}`));
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
      session_id: v.string(),
      class_id: v.string(),
      session_location: v.string(),
      session_date: v.string(),
      session_time: v.string(),
      class_name: v.string(),
      terms_accepted_at: v.optional(v.number()),
      terms_version: v.optional(v.string()),
      height: v.optional(v.string()),
      age: v.optional(v.number()),
      emergency_contact_name: v.optional(v.string()),
      emergency_contact_phone: v.optional(v.string()),
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
      session_id: session.session_id,
      class_id: session.class_id,
      session_location: session.location,
      session_date: session.date,
      session_time: session.time,
      class_name: classRecord?.name ?? "Unknown class",
      terms_accepted_at: participant.terms_accepted_at,
      terms_version: termsVersion,
      height: participant.height,
      age: participant.age,
      emergency_contact_name: participant.emergency_contact_name,
      emergency_contact_phone: participant.emergency_contact_phone,
    };
  },
});
