import { queryGeneric } from "convex/server";
import { v } from "convex/values";

export const getSessionParticipantsPageData = queryGeneric({
  args: {
    session_id: v.string(),
  },
  returns: v.union(
    v.null(),
    v.object({
      session_id: v.string(),
      class_name: v.string(),
      session_location: v.string(),
      session_date: v.string(),
      session_time: v.string(),
      participants: v.array(
        v.object({
          participant_id: v.string(),
          name: v.string(),
          mobile: v.string(),
          terms_accepted: v.boolean(),
          terms_version: v.optional(v.string()),
          attendance_status: v.string(),
        })
      ),
    })
  ),
  handler: async (ctx, args) => {
    const session = await ctx.db
      .query("sessions")
      .withIndex("by_session_id", (q) => q.eq("session_id", args.session_id))
      .first();

    if (!session) {
      return null;
    }

    const classRecord = await ctx.db
      .query("classes")
      .withIndex("by_class_id", (q) => q.eq("class_id", session.class_id))
      .first();

    const participants = await ctx.db
      .query("participants")
      .withIndex("by_session_id", (q) => q.eq("session_id", session.session_id))
      .collect();

    const attendanceRecords = await ctx.db
      .query("attendance_records")
      .withIndex("by_session_id", (q) => q.eq("session_id", session.session_id))
      .collect();

    const latestAttendanceByParticipant = new Map<
      string,
      { marked_at: number }
    >();
    for (const record of attendanceRecords) {
      const previous = latestAttendanceByParticipant.get(record.participant_id);
      if (!previous || previous.marked_at < record.marked_at) {
        latestAttendanceByParticipant.set(record.participant_id, {
          marked_at: record.marked_at,
        });
      }
    }

    const termsVersionById = new Map<string, string>();
    for (const participant of participants) {
      if (!participant.terms_version_id) {
        continue;
      }

      const termsVersionId = participant.terms_version_id;
      if (!termsVersionById.has(termsVersionId)) {
        const termsVersion = await ctx.db.get(termsVersionId);
        if (termsVersion) {
          termsVersionById.set(termsVersionId, termsVersion.version);
        }
      }
    }

    const participantRows = participants
      .map((participant) => {
        const attendance = latestAttendanceByParticipant.get(participant.participant_id);
        const participantName = participant.name?.trim() || "Unnamed participant";
        const mobile = participant.mobile?.trim() || "-";
        const termsAccepted = Boolean(participant.terms_accepted_at);
        const termsVersion = participant.terms_version_id
          ? termsVersionById.get(participant.terms_version_id)
          : undefined;

        return {
          participant_id: participant.participant_id,
          name: participantName,
          mobile,
          terms_accepted: termsAccepted,
          terms_version: termsVersion,
          attendance_status: attendance
            ? `Attended at ${new Date(attendance.marked_at).toISOString()}`
            : "Not attended",
        };
      })
      .sort((left, right) => {
        const nameCompare = left.name.localeCompare(right.name, undefined, {
          sensitivity: "base",
        });
        if (nameCompare !== 0) {
          return nameCompare;
        }
        return left.participant_id.localeCompare(right.participant_id);
      });

    return {
      session_id: session.session_id,
      class_name: classRecord?.name ?? "Unknown class",
      session_location: session.location,
      session_date: session.date,
      session_time: session.time,
      participants: participantRows,
    };
  },
});
