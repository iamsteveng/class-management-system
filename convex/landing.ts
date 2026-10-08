import { queryGeneric } from "convex/server";
import { v } from "convex/values";

import {
  applyClassValidator,
  applySessionsValidator,
  currentTerms,
  isOnSale,
  loadClassForApply,
  termsValidator,
} from "./applyPage";
import { venueValidator, toVenueFields } from "./venues";

/**
 * The cycling landing page: the Classes run from the Timetable, their bookable Sessions,
 * the Venues and how often each Venue runs. `live` is the launch switch: until the
 * REVAMP_HOMEPAGE environment variable is "on", the old homepage stays up.
 */
export const getLandingData = queryGeneric({
  args: {},
  returns: v.object({
    live: v.boolean(),
    classes: v.array(v.object({ class: applyClassValidator, sessions: applySessionsValidator })),
    venues: v.array(
      v.object({
        venue: venueValidator,
        days: v.array(v.object({ cycle_week: v.number(), weekday: v.number() })),
      })
    ),
    cycle_weeks: v.number(),
    sessions_per_cycle: v.number(),
    terms: termsValidator,
  }),
  handler: async (ctx) => {
    const live = process.env.REVAMP_HOMEPAGE === "on";
    const [entries, settings] = await Promise.all([
      ctx.db.query("timetable_entries").collect(),
      ctx.db
        .query("timetable_settings")
        .withIndex("by_key", (q) => q.eq("key", "default"))
        .first(),
    ]);

    const classIds = [...new Set(entries.map((entry) => entry.class_id))];
    const classDocs = [];
    for (const classId of classIds) {
      const cls = await ctx.db
        .query("classes")
        .withIndex("by_class_id", (q) => q.eq("class_id", classId))
        .first();
      if (cls && isOnSale(cls)) classDocs.push(cls);
    }
    classDocs.sort((a, b) => (a.age_min ?? 0) - (b.age_min ?? 0));

    const venueDocs = await ctx.db.query("venues").collect();
    const venues = venueDocs
      .filter((venue) => entries.some((entry) => entry.venue_id === venue.venue_id))
      .sort((a, b) => a.created_at - b.created_at)
      .map((venue) => {
        const days = new Map<string, { cycle_week: number; weekday: number }>();
        for (const entry of entries) {
          if (entry.venue_id !== venue.venue_id) continue;
          days.set(`${entry.cycle_week}-${entry.weekday}`, { cycle_week: entry.cycle_week, weekday: entry.weekday });
        }
        return {
          venue: toVenueFields(venue),
          days: [...days.values()].sort((a, b) => a.cycle_week - b.cycle_week || a.weekday - b.weekday),
        };
      });

    return {
      live,
      classes: await Promise.all(classDocs.map((cls) => loadClassForApply(ctx.db, cls))),
      venues,
      cycle_weeks: settings?.cycle_weeks ?? 2,
      sessions_per_cycle: entries.length,
      terms: await currentTerms(ctx.db),
    };
  },
});
