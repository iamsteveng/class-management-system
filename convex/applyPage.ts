import { queryGeneric, type GenericDatabaseReader } from "convex/server";
import { v } from "convex/values";

import type { DataModel, Doc } from "./_generated/dataModel";

import { remainingQuotaBySession } from "./remainingQuota";
import { hkDate, hkTime } from "./timetable";

const applySessionValidator = v.object({
  session_id: v.string(),
  date: v.string(),
  time: v.string(),
  end_time: v.optional(v.string()),
  location_zh: v.string(),
  location_en: v.optional(v.string()),
  google_maps_url: v.optional(v.string()),
  venue_id: v.optional(v.string()),
  district_zh: v.optional(v.string()),
  district_en: v.optional(v.string()),
  remaining_quota: v.number(),
  quota_defined: v.number(),
});

export const applyClassValidator = v.object({
  class_id: v.string(),
  name_zh: v.string(),
  name_en: v.optional(v.string()),
  description_zh: v.optional(v.string()),
  description_en: v.optional(v.string()),
  duration_minutes: v.optional(v.number()),
  image_url: v.optional(v.string()),
  price: v.number(),
  group_price: v.optional(v.number()),
  group_min_qty: v.number(),
  currency: v.string(),
  is_free: v.boolean(),
  age_min: v.optional(v.number()),
  age_max: v.optional(v.number()),
  class_size: v.optional(v.number()),
});

/**
 * Everything the apply flow needs for one Class: the Class as sold, its bookable
 * Sessions (visible, scheduled and not yet started, including full ones so they can be
 * shown as 已滿) and the current terms the Customer accepts on everyone's behalf.
 */
type ClassDoc = Doc<"classes">;

/**
 * A Class as sold, with its bookable Sessions (visible, scheduled, not yet started,
 * including full ones so they can be shown as 已滿).
 */
export async function loadClassForApply(db: GenericDatabaseReader<DataModel>, cls: ClassDoc) {
  const now = Date.now();
  const today = hkDate(now);
  const nowTime = hkTime(now);
  const sessions = (
    await db
      .query("sessions")
      .withIndex("by_class_id", (q) => q.eq("class_id", cls.class_id))
      .collect()
  ).filter(
    (s) =>
      s.status === "scheduled" &&
      s.hidden !== true &&
      (s.date > today || (s.date === today && s.time > nowTime))
  );

  const remaining = await remainingQuotaBySession(db, sessions);
  const venues = new Map((await db.query("venues").collect()).map((venue) => [venue.venue_id, venue]));

  return {
    class: {
      class_id: cls.class_id,
      name_zh: cls.name_zh ?? "",
      name_en: cls.name_en,
      description_zh: cls.description_zh,
      description_en: cls.description_en,
      duration_minutes: cls.duration_minutes,
      image_url: cls.image_url,
      price: cls.is_free ? 0 : (cls.airwallex_price ?? 0),
      group_price: cls.is_free ? undefined : cls.airwallex_group_price,
      group_min_qty: cls.airwallex_group_min_qty ?? 2,
      currency: cls.airwallex_currency ?? "HKD",
      is_free: cls.is_free === true,
      age_min: cls.age_min,
      age_max: cls.age_max,
      class_size: cls.class_size,
    },
    sessions: sessions
      .map((s) => {
        const venue = s.venue_id ? venues.get(s.venue_id) : undefined;
        return {
          session_id: s.session_id,
          date: s.date,
          time: s.time,
          end_time: s.end_time,
          location_zh: s.location_zh ?? venue?.name_zh ?? "",
          location_en: s.location_en ?? venue?.name_en,
          google_maps_url: s.google_maps_url,
          venue_id: s.venue_id,
          district_zh: venue?.district_zh,
          district_en: venue?.district_en,
          remaining_quota: remaining.get(s.session_id) ?? 0,
          quota_defined: s.quota_defined,
        };
      })
      .sort((a, b) => `${a.date}T${a.time}`.localeCompare(`${b.date}T${b.time}`)),
  };
}

export function isOnSale(cls: ClassDoc) {
  return cls.status === "active" && (typeof cls.airwallex_price === "number" || cls.is_free === true);
}

export async function currentTerms(db: GenericDatabaseReader<DataModel>) {
  const terms = await db
    .query("terms_versions")
    .withIndex("by_is_current", (q) => q.eq("is_current", true))
    .first();
  return terms ? { version: terms.version, content: terms.content } : null;
}

export const applySessionsValidator = v.array(applySessionValidator);
export const termsValidator = v.union(v.null(), v.object({ version: v.string(), content: v.string() }));

/**
 * Everything the apply flow needs for one Class: the Class as sold, its bookable
 * Sessions and the current terms the Customer accepts on everyone's behalf.
 */
export const getApplyPageData = queryGeneric({
  args: { class_id: v.string() },
  returns: v.union(
    v.null(),
    v.object({
      class: applyClassValidator,
      sessions: applySessionsValidator,
      terms: termsValidator,
    })
  ),
  handler: async (ctx, args) => {
    const cls = await ctx.db
      .query("classes")
      .withIndex("by_class_id", (q) => q.eq("class_id", args.class_id))
      .first();
    if (!cls || !isOnSale(cls)) return null;
    return { ...(await loadClassForApply(ctx.db, cls)), terms: await currentTerms(ctx.db) };
  },
});
