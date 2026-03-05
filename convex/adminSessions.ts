import { mutationGeneric, queryGeneric } from "convex/server";
import { v } from "convex/values";

export const getSessionManagementPageData = queryGeneric({
  args: {
    class_id: v.string(),
  },
  returns: v.union(
    v.null(),
    v.object({
      class_id: v.string(),
      class_name: v.string(),
      sessions: v.array(
        v.object({
          session_id: v.string(),
          location: v.string(),
          date: v.string(),
          time: v.string(),
          quota_defined: v.number(),
          quota_used: v.number(),
          quota_available: v.number(),
          status: v.union(
            v.literal("scheduled"),
            v.literal("completed"),
            v.literal("cancelled")
          ),
        })
      ),
    })
  ),
  handler: async (ctx, args) => {
    const classRecord = await ctx.db
      .query("classes")
      .withIndex("by_class_id", (q) => q.eq("class_id", args.class_id))
      .first();

    if (!classRecord) {
      return null;
    }

    const sessions = await ctx.db
      .query("sessions")
      .withIndex("by_class_id", (q) => q.eq("class_id", args.class_id))
      .collect();

    const sessionRows = sessions.map((s) => ({
      session_id: s.session_id,
      location: s.location,
      date: s.date,
      time: s.time,
      quota_defined: s.quota_defined,
      quota_used: s.quota_used,
      quota_available: Math.max(0, s.quota_defined - s.quota_used),
      status: s.status,
    }));

    return {
      class_id: classRecord.class_id,
      class_name: classRecord.name,
      sessions: sessionRows,
    };
  },
});

export const createSession = mutationGeneric({
  args: {
    class_id: v.string(),
    location: v.string(),
    date: v.string(),
    time: v.string(),
    quota_defined: v.number(),
    admin_username: v.string(),
  },
  returns: v.object({
    session_id: v.string(),
  }),
  handler: async (ctx, args) => {
    const now = Date.now();
    const sessionId = crypto.randomUUID();

    const admin = await ctx.db
      .query("admins")
      .withIndex("by_username", (q) => q.eq("username", args.admin_username))
      .first();

    await ctx.db.insert("sessions", {
      session_id: sessionId,
      class_id: args.class_id,
      location: args.location.trim(),
      date: args.date.trim(),
      time: args.time.trim(),
      quota_defined: args.quota_defined,
      quota_used: 0,
      status: "scheduled",
      created_at: now,
    });

    await ctx.db.insert("audit_logs", {
      admin_id: admin?._id,
      action: "session_created",
      entity_type: "sessions",
      entity_id: sessionId,
      metadata: {
        class_id: args.class_id,
        location: args.location.trim(),
        date: args.date.trim(),
        time: args.time.trim(),
        quota_defined: args.quota_defined,
      },
      created_at: now,
    });

    return { session_id: sessionId };
  },
});

export const updateSession = mutationGeneric({
  args: {
    session_id: v.string(),
    location: v.string(),
    date: v.string(),
    time: v.string(),
    quota_defined: v.number(),
    admin_username: v.string(),
  },
  returns: v.object({
    session_id: v.string(),
  }),
  handler: async (ctx, args) => {
    const sessionRecord = await ctx.db
      .query("sessions")
      .withIndex("by_session_id", (q) => q.eq("session_id", args.session_id))
      .first();

    if (!sessionRecord) {
      throw new Error("Session not found.");
    }

    const admin = await ctx.db
      .query("admins")
      .withIndex("by_username", (q) => q.eq("username", args.admin_username))
      .first();

    if (!admin || admin.role !== "super_admin") {
      throw new Error("Only super admins can edit sessions.");
    }

    const nextLocation = args.location.trim();
    const nextDate = args.date.trim();
    const nextTime = args.time.trim();
    const nextQuotaDefined = args.quota_defined;

    if (!nextLocation || !nextDate || !nextTime || nextQuotaDefined < 1) {
      throw new Error("Invalid session details.");
    }

    const now = Date.now();
    await ctx.db.patch(sessionRecord._id, {
      location: nextLocation,
      date: nextDate,
      time: nextTime,
      quota_defined: nextQuotaDefined,
    });

    await ctx.db.insert("audit_logs", {
      admin_id: admin._id,
      action: "session_updated",
      entity_type: "sessions",
      entity_id: sessionRecord.session_id,
      metadata: {
        previous_location: sessionRecord.location,
        next_location: nextLocation,
        previous_date: sessionRecord.date,
        next_date: nextDate,
        previous_time: sessionRecord.time,
        next_time: nextTime,
        previous_quota_defined: sessionRecord.quota_defined,
        next_quota_defined: nextQuotaDefined,
      },
      created_at: now,
    });

    return { session_id: sessionRecord.session_id };
  },
});

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

export const markAttendanceFromScan = mutationGeneric({
  args: {
    session_id: v.string(),
    participant_id: v.string(),
    admin_username: v.string(),
  },
  returns: v.object({
    status: v.union(
      v.literal("success"),
      v.literal("invalid_session"),
      v.literal("already_attended"),
      v.literal("participant_not_found"),
      v.literal("admin_not_found")
    ),
    participant_id: v.optional(v.string()),
    participant_name: v.optional(v.string()),
    marked_at: v.optional(v.number()),
  }),
  handler: async (ctx, args) => {
    const now = Date.now();
    const participantId = args.participant_id.trim();
    const adminUsername = args.admin_username.trim();

    const admin = await ctx.db
      .query("admins")
      .withIndex("by_username", (q) => q.eq("username", adminUsername))
      .first();

    if (!admin) {
      return { status: "admin_not_found" } as const;
    }

    const participant = await ctx.db
      .query("participants")
      .withIndex("by_participant_id", (q) => q.eq("participant_id", participantId))
      .first();

    if (!participant) {
      await ctx.db.insert("audit_logs", {
        admin_id: admin._id,
        action: "attendance_scan_participant_not_found",
        entity_type: "attendance_records",
        entity_id: participantId,
        metadata: {
          participant_id: participantId,
          session_id: args.session_id,
        },
        created_at: now,
      });
      return { status: "participant_not_found" } as const;
    }

    if (participant.session_id !== args.session_id) {
      await ctx.db.insert("audit_logs", {
        admin_id: admin._id,
        action: "attendance_scan_invalid_session",
        entity_type: "participants",
        entity_id: participant.participant_id,
        metadata: {
          participant_id: participant.participant_id,
          participant_session_id: participant.session_id,
          attempted_session_id: args.session_id,
        },
        created_at: now,
      });
      return {
        status: "invalid_session",
        participant_id: participant.participant_id,
        participant_name: participant.name?.trim() || "Unnamed participant",
      } as const;
    }

    const attendanceRecords = await ctx.db
      .query("attendance_records")
      .withIndex("by_session_id", (q) => q.eq("session_id", args.session_id))
      .collect();

    const latestAttendance = attendanceRecords
      .filter((record) => record.participant_id === participant.participant_id)
      .sort((left, right) => right.marked_at - left.marked_at)[0];

    if (latestAttendance) {
      await ctx.db.insert("audit_logs", {
        admin_id: admin._id,
        action: "attendance_scan_already_marked",
        entity_type: "attendance_records",
        entity_id: latestAttendance.attendance_id,
        metadata: {
          participant_id: participant.participant_id,
          session_id: args.session_id,
          marked_at: latestAttendance.marked_at,
        },
        created_at: now,
      });
      return {
        status: "already_attended",
        participant_id: participant.participant_id,
        participant_name: participant.name?.trim() || "Unnamed participant",
        marked_at: latestAttendance.marked_at,
      } as const;
    }

    const attendanceId = crypto.randomUUID();
    await ctx.db.insert("attendance_records", {
      attendance_id: attendanceId,
      participant_id: participant.participant_id,
      session_id: args.session_id,
      marked_by_admin: admin._id,
      marked_at: now,
      created_at: now,
    });

    await ctx.db.insert("audit_logs", {
      admin_id: admin._id,
      action: "attendance_marked",
      entity_type: "attendance_records",
      entity_id: attendanceId,
      metadata: {
        participant_id: participant.participant_id,
        session_id: args.session_id,
      },
      created_at: now,
    });

    return {
      status: "success",
      participant_id: participant.participant_id,
      participant_name: participant.name?.trim() || "Unnamed participant",
      marked_at: now,
    } as const;
  },
});
