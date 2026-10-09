import {
  internalMutationGeneric,
  type GenericMutationCtx,
} from "convex/server";
import { v } from "convex/values";
import { serverMutation, serverQuery } from "./serverOnly";

import type { DataModel } from "./_generated/dataModel";
import { sessionLocationFromVenue } from "./venues";

const HK_OFFSET_MS = 8 * 60 * 60 * 1000;

/** Today's date in Hong Kong, as YYYY-MM-DD. */
export function hkDate(nowMs: number): string {
  return new Date(nowMs + HK_OFFSET_MS).toISOString().slice(0, 10);
}

/** The current Hong Kong time of day, as HH:MM. */
export function hkTime(nowMs: number): string {
  return new Date(nowMs + HK_OFFSET_MS).toISOString().slice(11, 16);
}

export function addDays(date: string, days: number): string {
  const d = new Date(`${date}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

/** 0 = Monday … 6 = Sunday. */
export function weekdayOf(date: string): number {
  return (new Date(`${date}T00:00:00Z`).getUTCDay() + 6) % 7;
}

/** Which week of the cycle (1-based) a date falls in, counting from the anchor Monday. */
export function cycleWeekOf(date: string, anchor: string, cycleWeeks: number): number {
  const days = Math.round(
    (Date.parse(`${date}T00:00:00Z`) - Date.parse(`${anchor}T00:00:00Z`)) / 86_400_000
  );
  const week = Math.floor(days / 7);
  return (((week % cycleWeeks) + cycleWeeks) % cycleWeeks) + 1;
}

type EntryLike = {
  entry_id: string;
  cycle_week: number;
  weekday: number;
  start_time: string;
  paused?: boolean;
};

type SettingsLike = {
  cycle_anchor: string;
  cycle_weeks: number;
  window_days: number;
  paused?: boolean;
};

/**
 * Every (entry, date) the Timetable calls for from `today` through the open window,
 * leaving out paused entries and anything that has already started.
 */
export function occurrencesInWindow<E extends EntryLike>(
  entries: E[],
  settings: SettingsLike,
  today: string,
  nowTime: string
): Array<{ entry: E; date: string }> {
  if (settings.paused) return [];
  const out: Array<{ entry: E; date: string }> = [];
  for (let i = 0; i < settings.window_days; i++) {
    const date = addDays(today, i);
    if (date < settings.cycle_anchor) continue;
    const week = cycleWeekOf(date, settings.cycle_anchor, settings.cycle_weeks);
    const weekday = weekdayOf(date);
    for (const entry of entries) {
      if (entry.paused || entry.cycle_week !== week || entry.weekday !== weekday) continue;
      if (i === 0 && entry.start_time <= nowTime) continue;
      out.push({ entry, date });
    }
  }
  return out;
}

/**
 * Opens every Session the Timetable calls for within the window that has never been
 * opened. A Session that was opened once is never recreated or changed here, so admins
 * can cancel, hide or edit it freely.
 */
export async function openTimetableSessions(
  ctx: GenericMutationCtx<DataModel>,
  nowMs: number,
  todayOverride?: string
): Promise<number> {
  const settings = await ctx.db
    .query("timetable_settings")
    .withIndex("by_key", (q) => q.eq("key", "default"))
    .first();
  if (!settings) return 0;

  const today = todayOverride ?? hkDate(nowMs);
  // When opening as if it were another day, nothing on that day has started yet.
  const nowTime = todayOverride ? "00:00" : hkTime(nowMs);
  const entries = await ctx.db.query("timetable_entries").collect();
  const occurrences = occurrencesInWindow(entries, settings, today, nowTime);

  const classes = new Map<string, { class_size?: number } | null>();
  const venues = new Map<string, Parameters<typeof sessionLocationFromVenue>[0] | null>();
  let opened = 0;

  for (const { entry, date } of occurrences) {
    const existing = await ctx.db
      .query("sessions")
      .withIndex("by_timetable_entry_date", (q) =>
        q.eq("timetable_entry_id", entry.entry_id).eq("date", date)
      )
      .first();
    if (existing) continue;

    if (!classes.has(entry.class_id)) {
      classes.set(
        entry.class_id,
        await ctx.db
          .query("classes")
          .withIndex("by_class_id", (q) => q.eq("class_id", entry.class_id))
          .first()
      );
    }
    if (!venues.has(entry.venue_id)) {
      venues.set(
        entry.venue_id,
        await ctx.db
          .query("venues")
          .withIndex("by_venue_id", (q) => q.eq("venue_id", entry.venue_id))
          .first()
      );
    }
    const cls = classes.get(entry.class_id);
    const venue = venues.get(entry.venue_id);
    if (!cls || !venue || !cls.class_size) {
      console.warn(`[timetable] cannot open ${entry.entry_id} on ${date}: missing Class, Venue or Class Size`);
      continue;
    }

    await ctx.db.insert("sessions", {
      session_id: crypto.randomUUID(),
      class_id: entry.class_id,
      ...sessionLocationFromVenue(venue),
      date,
      time: entry.start_time,
      end_time: entry.end_time,
      quota_defined: cls.class_size,
      quota_used: 0,
      status: "scheduled",
      timetable_entry_id: entry.entry_id,
      created_at: nowMs,
    });
    opened++;
  }

  return opened;
}

/** Run daily by the cron, and by the catalogue seed. */
export const openSessions = internalMutationGeneric({
  args: { today: v.optional(v.string()) },
  returns: v.object({ opened: v.number() }),
  handler: async (ctx, args) => ({
    opened: await openTimetableSessions(ctx, Date.now(), args.today),
  }),
});

const WEEKDAY_LABELS = ["一", "二", "三", "四", "五", "六", "日"];

export const getTimetable = serverQuery({
  args: {},
  returns: v.union(
    v.null(),
    v.object({
      cycle_anchor: v.string(),
      cycle_weeks: v.number(),
      window_days: v.number(),
      paused: v.boolean(),
      entries: v.array(
        v.object({
          entry_id: v.string(),
          class_id: v.string(),
          class_name_zh: v.string(),
          venue_id: v.string(),
          venue_name_zh: v.string(),
          cycle_week: v.number(),
          weekday: v.number(),
          weekday_label: v.string(),
          start_time: v.string(),
          end_time: v.string(),
          paused: v.boolean(),
        })
      ),
    })
  ),
  handler: async (ctx) => {
    const settings = await ctx.db
      .query("timetable_settings")
      .withIndex("by_key", (q) => q.eq("key", "default"))
      .first();
    if (!settings) return null;

    const [entries, classes, venues] = await Promise.all([
      ctx.db.query("timetable_entries").collect(),
      ctx.db.query("classes").collect(),
      ctx.db.query("venues").collect(),
    ]);
    const className = new Map(classes.map((c) => [c.class_id, c.name_zh ?? c.class_id]));
    const venueName = new Map(venues.map((venue) => [venue.venue_id, venue.name_zh]));

    return {
      cycle_anchor: settings.cycle_anchor,
      cycle_weeks: settings.cycle_weeks,
      window_days: settings.window_days,
      paused: settings.paused === true,
      entries: entries
        .map((entry) => ({
          entry_id: entry.entry_id,
          class_id: entry.class_id,
          class_name_zh: className.get(entry.class_id) ?? entry.class_id,
          venue_id: entry.venue_id,
          venue_name_zh: venueName.get(entry.venue_id) ?? entry.venue_id,
          cycle_week: entry.cycle_week,
          weekday: entry.weekday,
          weekday_label: WEEKDAY_LABELS[entry.weekday] ?? String(entry.weekday),
          start_time: entry.start_time,
          end_time: entry.end_time,
          paused: entry.paused === true,
        }))
        .sort(
          (a, b) =>
            a.cycle_week - b.cycle_week ||
            a.weekday - b.weekday ||
            a.start_time.localeCompare(b.start_time)
        ),
    };
  },
});

async function requireSuperAdmin(ctx: GenericMutationCtx<DataModel>, username: string) {
  const admin = await ctx.db
    .query("admins")
    .withIndex("by_username", (q) => q.eq("username", username))
    .first();
  if (!admin || admin.role !== "super_admin") {
    throw new Error("Only super admins can pause the Timetable.");
  }
  return admin;
}

/** Pause or resume the whole Timetable. Sessions already open are untouched. */
export const setTimetablePaused = serverMutation({
  args: { paused: v.boolean(), admin_username: v.string() },
  returns: v.null(),
  handler: async (ctx, args) => {
    const admin = await requireSuperAdmin(ctx, args.admin_username);
    const settings = await ctx.db
      .query("timetable_settings")
      .withIndex("by_key", (q) => q.eq("key", "default"))
      .first();
    if (!settings) throw new Error("There is no Timetable yet.");

    await ctx.db.patch(settings._id, { paused: args.paused, updated_at: Date.now() });
    await ctx.db.insert("audit_logs", {
      admin_id: admin._id,
      action: args.paused ? "timetable_paused" : "timetable_resumed",
      entity_type: "timetable",
      entity_id: "default",
      created_at: Date.now(),
    });
    return null;
  },
});

/** Pause or resume one Timetable entry. Sessions already open from it are untouched. */
export const setTimetableEntryPaused = serverMutation({
  args: { entry_id: v.string(), paused: v.boolean(), admin_username: v.string() },
  returns: v.null(),
  handler: async (ctx, args) => {
    const admin = await requireSuperAdmin(ctx, args.admin_username);
    const entry = await ctx.db
      .query("timetable_entries")
      .withIndex("by_entry_id", (q) => q.eq("entry_id", args.entry_id))
      .first();
    if (!entry) throw new Error("Timetable entry not found.");

    await ctx.db.patch(entry._id, { paused: args.paused });
    await ctx.db.insert("audit_logs", {
      admin_id: admin._id,
      action: args.paused ? "timetable_entry_paused" : "timetable_entry_resumed",
      entity_type: "timetable_entry",
      entity_id: entry.entry_id,
      created_at: Date.now(),
    });
    return null;
  },
});
