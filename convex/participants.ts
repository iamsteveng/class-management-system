import { queryGeneric } from "convex/server";
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
      session_date: v.string(),
      session_time: v.string(),
      class_name: v.string(),
      qr_code_data: v.string(),
      can_change_session: v.boolean(),
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

    const sessionStartsAt = Date.parse(`${session.date}T${session.time}:00`);
    const twoDaysInMs = 2 * 24 * 60 * 60 * 1000;
    const canChangeSession =
      Number.isFinite(sessionStartsAt) && sessionStartsAt - Date.now() > twoDaysInMs;

    return {
      participant_id: participant.participant_id,
      participant_name: participant.name?.trim() || "Participant",
      session_id: session.session_id,
      session_location: session.location,
      session_date: session.date,
      session_time: session.time,
      class_name: classRecord.name,
      qr_code_data: participant.qr_code_data ?? participant.participant_id,
      can_change_session: canChangeSession,
    };
  },
});
