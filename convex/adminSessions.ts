import {
  makeFunctionReference,
  type GenericDatabaseReader,
} from "convex/server";
import { v } from "convex/values";
import { serverMutation, serverQuery } from "./serverOnly";

import type { DataModel } from "./_generated/dataModel";

import { remainingQuotaBySession } from "./remainingQuota";
import { sessionLocationFromVenue, toVenueFields } from "./venues";

/**
 * Where a Session created or edited by an admin is held: a Venue when one is picked (its
 * name and map position then win over any typed location), otherwise the typed location.
 */
async function resolveSessionLocation(
  db: GenericDatabaseReader<DataModel>,
  args: { venue_id?: string; location_zh: string; location_en?: string; google_maps_url?: string }
) {
  if (args.venue_id) {
    const venue = await db
      .query("venues")
      .withIndex("by_venue_id", (q) => q.eq("venue_id", args.venue_id!))
      .first();
    if (!venue) throw new Error("Venue not found.");
    return sessionLocationFromVenue(toVenueFields(venue));
  }
  return {
    venue_id: undefined,
    location_zh: args.location_zh.trim(),
    location_en: args.location_en?.trim() || undefined,
    google_maps_url: args.google_maps_url,
  };
}

export const getSessionManagementPageData = serverQuery({
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
          location_zh: v.string(),
          location_en: v.optional(v.string()),
          end_time: v.optional(v.string()),
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
          google_maps_url: v.optional(v.string()),
          cancellation_reason: v.optional(v.literal("rain")),
          hidden: v.boolean(),
          venue_id: v.optional(v.string()),
        })
      ),
      class_size: v.optional(v.number()),
      venues: v.array(v.object({ venue_id: v.string(), name_zh: v.string() })),
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

    const remaining = await remainingQuotaBySession(ctx.db, sessions);

    const sessionRows = sessions.map((s) => ({
      session_id: s.session_id,
      location_zh: s.location_zh ?? "",
      location_en: s.location_en,
      end_time: s.end_time,
      date: s.date,
      time: s.time,
      quota_defined: s.quota_defined,
      quota_used: s.quota_used,
      quota_available: remaining.get(s.session_id) ?? 0,
      status: s.status,
      google_maps_url: s.google_maps_url,
      cancellation_reason: s.cancellation_reason,
      hidden: s.hidden === true,
      venue_id: s.venue_id,
    }));

    sessionRows.sort((a, b) => {
      const aDateTime = `${a.date}T${a.time}`;
      const bDateTime = `${b.date}T${b.time}`;
      return bDateTime.localeCompare(aDateTime);
    });

    const venues = (await ctx.db.query("venues").collect())
      .sort((x, y) => x.created_at - y.created_at)
      .map((venue) => ({ venue_id: venue.venue_id, name_zh: venue.name_zh }));

    return {
      class_id: classRecord.class_id,
      class_name: classRecord.name_zh ?? "",
      sessions: sessionRows,
      class_size: classRecord.class_size,
      venues,
    };
  },
});

export const createSession = serverMutation({
  args: {
    class_id: v.string(),
    location_zh: v.string(),
    location_en: v.optional(v.string()),
    end_time: v.optional(v.string()),
    date: v.string(),
    time: v.string(),
    quota_defined: v.number(),
    admin_username: v.string(),
    google_maps_url: v.optional(v.string()),
    venue_id: v.optional(v.string()),
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

    const location = await resolveSessionLocation(ctx.db, args);
    if (!location.location_zh) {
      throw new Error("A Venue or a location is required.");
    }

    await ctx.db.insert("sessions", {
      session_id: sessionId,
      class_id: args.class_id,
      ...location,
      end_time: args.end_time?.trim() || undefined,
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
        location_zh: location.location_zh,
        venue_id: location.venue_id,
        date: args.date.trim(),
        time: args.time.trim(),
        quota_defined: args.quota_defined,
      },
      created_at: now,
    });

    return { session_id: sessionId };
  },
});

export const updateSession = serverMutation({
  args: {
    session_id: v.string(),
    location_zh: v.string(),
    location_en: v.optional(v.string()),
    end_time: v.optional(v.string()),
    date: v.string(),
    time: v.string(),
    quota_defined: v.number(),
    admin_username: v.string(),
    google_maps_url: v.optional(v.string()),
    // "" means the Session no longer has a Venue; leaving it out keeps the current one.
    venue_id: v.optional(v.string()),
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

    const location =
      args.venue_id === undefined && sessionRecord.venue_id
        ? await resolveSessionLocation(ctx.db, { ...args, venue_id: sessionRecord.venue_id })
        : await resolveSessionLocation(ctx.db, { ...args, venue_id: args.venue_id || undefined });
    const nextLocationZh = location.location_zh;
    const nextEndTime = args.end_time?.trim() || undefined;
    const nextDate = args.date.trim();
    const nextTime = args.time.trim();
    const nextQuotaDefined = args.quota_defined;

    if (!nextLocationZh || !nextDate || !nextTime || nextQuotaDefined < 1) {
      throw new Error("Invalid session details.");
    }

    const now = Date.now();
    await ctx.db.patch(sessionRecord._id, {
      ...location,
      end_time: nextEndTime,
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
        previous_location_zh: sessionRecord.location_zh,
        next_location_zh: nextLocationZh,
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

/**
 * Hide or show a scheduled Session. Hiding only controls whether Customers and
 * Participants can see and pick it; Participants already in it are untouched.
 */
export const setSessionHidden = serverMutation({
  args: {
    session_id: v.string(),
    hidden: v.boolean(),
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
      throw new Error("Only super admins can hide or show sessions.");
    }

    if (sessionRecord.status !== "scheduled") {
      throw new Error("Only scheduled sessions can be hidden or shown.");
    }

    const wasHidden = sessionRecord.hidden === true;
    if (wasHidden === args.hidden) {
      return { session_id: sessionRecord.session_id };
    }

    await ctx.db.patch(sessionRecord._id, { hidden: args.hidden });

    await ctx.db.insert("audit_logs", {
      admin_id: admin._id,
      action: args.hidden ? "session_hidden" : "session_shown",
      entity_type: "sessions",
      entity_id: sessionRecord.session_id,
      metadata: {
        previous_hidden: wasHidden,
        next_hidden: args.hidden,
      },
      created_at: Date.now(),
    });

    return { session_id: sessionRecord.session_id };
  },
});

export const cancelSession = serverMutation({
  args: {
    session_id: v.string(),
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
      throw new Error("Only super admins can cancel sessions.");
    }

    if (sessionRecord.status === "cancelled") {
      return { session_id: sessionRecord.session_id };
    }

    const enrolledParticipants = await ctx.db
      .query("participants")
      .withIndex("by_session_id", (q) =>
        q.eq("session_id", sessionRecord.session_id)
      )
      .first();

    if (enrolledParticipants) {
      throw new Error("Cannot cancel: session has enrolled participants");
    }

    const now = Date.now();
    await ctx.db.patch(sessionRecord._id, {
      status: "cancelled",
    });

    await ctx.db.insert("audit_logs", {
      admin_id: admin._id,
      action: "session_cancelled",
      entity_type: "sessions",
      entity_id: sessionRecord.session_id,
      metadata: {
        previous_status: sessionRecord.status,
        next_status: "cancelled",
      },
      created_at: now,
    });

    return { session_id: sessionRecord.session_id };
  },
});

export const markSessionRainCancelled = serverMutation({
  args: {
    session_id: v.string(),
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
      throw new Error("Only super admins can mark sessions as rain-cancelled.");
    }

    if (sessionRecord.status === "completed") {
      throw new Error("Cannot rain-cancel a completed session.");
    }

    // Idempotency: already rain-cancelled — return without re-notifying participants
    if (sessionRecord.status === "cancelled" && sessionRecord.cancellation_reason === "rain") {
      return { session_id: sessionRecord.session_id };
    }

    const now = Date.now();
    await ctx.db.patch(sessionRecord._id, {
      status: "cancelled",
      cancellation_reason: "rain",
    });

    await ctx.db.insert("audit_logs", {
      admin_id: admin._id,
      action: "session_rain_cancelled",
      entity_type: "sessions",
      entity_id: sessionRecord.session_id,
      metadata: {
        previous_status: sessionRecord.status,
      },
      created_at: now,
    });

    const participants = await ctx.db
      .query("participants")
      .withIndex("by_session_id", (q) =>
        q.eq("session_id", sessionRecord.session_id)
      )
      .collect();

    for (const participant of participants) {
      await ctx.scheduler.runAfter(
        0,
        makeFunctionReference<"action">("rainCancellationNotification:sendRainCancellationNotification"),
        { participant_id: participant.participant_id }
      );
    }

    return { session_id: sessionRecord.session_id };
  },
});

export const getSessionParticipantsPageData = serverQuery({
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
          email: v.optional(v.string()),
          height: v.optional(v.number()),
          age: v.optional(v.number()),
          riding_experience: v.optional(v.string()),
          health_notes: v.optional(v.string()),
          photo_consent: v.optional(v.boolean()),
          terms_accepted: v.boolean(),
          terms_accepted_by: v.optional(v.string()),
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
          email: participant.email?.trim() || undefined,
          height: participant.height,
          age: participant.age,
          riding_experience: participant.riding_experience,
          health_notes: participant.health_notes,
          photo_consent: participant.photo_consent,
          terms_accepted: termsAccepted,
          terms_accepted_by: participant.terms_accepted_by,
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
      class_name: classRecord?.name_zh ?? "Unknown class",
      session_location: session.location_zh ?? "",
      session_date: session.date,
      session_time: session.time,
      participants: participantRows,
    };
  },
});

export const getSessionAttendance = serverQuery({
  args: {
    session_id: v.string(),
  },
  returns: v.array(
    v.object({
      attendance_id: v.string(),
      participant_id: v.string(),
      session_id: v.string(),
      admin_username: v.string(),
      marked_at: v.number(),
    })
  ),
  handler: async (ctx, args) => {
    const records = await ctx.db
      .query("attendance_records")
      .withIndex("by_session_id", (q) => q.eq("session_id", args.session_id))
      .collect();

    const adminById = new Map<string, string>();
    for (const record of records) {
      const adminId = record.marked_by_admin;
      if (!adminById.has(adminId)) {
        const admin = await ctx.db.get(adminId);
        if (admin) {
          adminById.set(adminId, admin.username);
        }
      }
    }

    return records.map((r) => ({
      attendance_id: r.attendance_id,
      participant_id: r.participant_id,
      session_id: r.session_id,
      admin_username: adminById.get(r.marked_by_admin) ?? "unknown",
      marked_at: r.marked_at,
    }));
  },
});

export const markAttendanceFromScan = serverMutation({
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
