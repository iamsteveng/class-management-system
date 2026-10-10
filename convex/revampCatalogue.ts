import { internalMutationGeneric } from "convex/server";
import { v } from "convex/values";

import { CYCLING_WAIVER_TEXT, CYCLING_WAIVER_VERSION } from "./termsContent";
import { publishTermsIfChanged } from "./termsPublish";
import { hkDate, openTimetableSessions } from "./timetable";
import { refreshUpcomingSessionLocations, type VenueFields } from "./venues";
import { KIDS_CLASS_ID, REGULAR_CLASS_ID } from "../lib/catalogueIds";

/**
 * The real cycling catalogue launched with the homepage revamp: its Classes, Venues,
 * Timetable and the waiver Customers accept. Venue addresses, hours, positions and map links follow
 * https://marketing.loco.hk/locokiosk.html. Changing the Timetable means editing this file and running the seed again;
 * only Sessions not yet opened are affected.
 *
 * Load it with:  npx convex run revampCatalogue:seed '{}'          (dev)
 *                npx convex run revampCatalogue:seed '{}' --prod   (prod, once, at launch)
 */

export const CYCLE_ANCHOR = "2026-10-05"; // Monday of week 1
export const FIRST_CLASS_DATE = "2026-10-21"; // the first class; nothing is opened before it
const CYCLE_WEEKS = 2;
const WINDOW_DAYS = 28;

export { KIDS_CLASS_ID, REGULAR_CLASS_ID };

type ClassSeed = {
  class_id: string;
  name_zh: string;
  name_en: string;
  description_zh: string;
  description_en: string;
  duration_minutes: number;
  image_url: string;
  airwallex_price: number;
  airwallex_currency: string;
  airwallex_group_price: number;
  airwallex_group_min_qty: number;
  age_min: number;
  age_max: number;
  class_size: number;
};

export const CLASSES: ClassSeed[] = [
  {
    class_id: KIDS_CLASS_ID,
    name_zh: "幼兒班",
    name_en: "Kids Class",
    description_zh: "以遊戲帶技巧：先學平衡，再學起步、煞車同轉向，建立信心。",
    description_en: "Skills through games: balance first, then starting, braking and steering, building confidence.",
    duration_minutes: 60,
    image_url: "/images/revamp/class-kids.jpg",
    airwallex_price: 180,
    airwallex_currency: "HKD",
    airwallex_group_price: 150,
    airwallex_group_min_qty: 2,
    age_min: 5,
    age_max: 12,
    class_size: 6,
  },
  {
    class_id: REGULAR_CLASS_ID,
    name_zh: "常規班",
    name_en: "Regular Class",
    description_zh: "由平衡、控制到安全停車，再學香港單車徑規則、手勢同路權。",
    description_en:
      "From balance and control to stopping safely, then Hong Kong cycle-track rules, hand signals and right of way.",
    duration_minutes: 60,
    image_url: "/images/revamp/class-regular.jpg",
    airwallex_price: 180,
    airwallex_currency: "HKD",
    airwallex_group_price: 150,
    airwallex_group_min_qty: 2,
    age_min: 13,
    age_max: 60,
    class_size: 8,
  },
];

export const VENUES: VenueFields[] = [
  {
    venue_id: "venue_tsw",
    name_zh: "天水圍樂區單車亭",
    name_en: "Tin Shui Wai Loco Bike Kiosk",
    district_zh: "天水圍",
    district_en: "Tin Shui Wai",
    address_zh: "天水圍天福路（天水圍西鐵站）",
    address_en: "Tin Fuk Road, Tin Shui Wai (Tin Shui Wai Station)",
    opening_hours: "10:00 – 20:00",
    latitude: 22.4512014,
    longitude: 114.0077887,
    maps_url: "https://maps.app.goo.gl/JtMn7v9AgziStm9QA",
    mtr_station_zh: "天水圍站",
    mtr_station_en: "Tin Shui Wai Station",
    mtr_line_zh: "屯馬綫",
    mtr_line_en: "Tuen Ma Line",
    mtr_latitude: 22.4482155,
    mtr_longitude: 114.0047431,
    walk_minutes: 8,
    directions_zh: "出站後往東北面行，去天福路，單車亭就喺天福路旁。",
    directions_en: "Leave the station heading north-east to Tin Fuk Road; the kiosk is beside the road.",
  },
  {
    venue_id: "venue_ty",
    name_zh: "青衣樂區單車亭",
    name_en: "Tsing Yi Loco Bike Kiosk",
    district_zh: "青衣",
    district_en: "Tsing Yi",
    address_zh: "青衣東北公園單車亭 新界青衣担杆山路 10 號",
    address_en: "Tsing Yi Northeast Park bike kiosk (10 Tam Kon Shan Road, Tsing Yi)",
    opening_hours: "10:00 – 20:00",
    latitude: 22.3617677,
    longitude: 114.0988369,
    maps_url: "https://maps.app.goo.gl/RtQvZUgZhmEyp3Kr8",
    mtr_station_zh: "青衣站",
    mtr_station_en: "Tsing Yi Station",
    mtr_line_zh: "東涌綫",
    mtr_line_en: "Tung Chung Line",
    mtr_latitude: 22.3584978,
    mtr_longitude: 114.107672,
    walk_minutes: 16,
    directions_zh: "出站後往西北面海旁方向行，經担杆山路入青衣東北公園，單車亭喺公園入面。",
    directions_en:
      "Leave the station heading north-west towards the waterfront, then take Tam Kon Shan Road into Tsing Yi Northeast Park; the kiosk is inside the park.",
  },
  {
    venue_id: "venue_tko",
    name_zh: "將軍澳樂區單車亭",
    name_en: "Tseung Kwan O Loco Bike Kiosk",
    district_zh: "將軍澳",
    district_en: "Tseung Kwan O",
    address_zh: "將軍澳南公園",
    address_en: "Tseung Kwan O South Park",
    opening_hours: "11:00 – 21:00",
    latitude: 22.30211,
    longitude: 114.260241,
    maps_url: "https://maps.app.goo.gl/ygs6PyUMwTE2rn5M6",
    mtr_station_zh: "將軍澳站",
    mtr_station_en: "Tseung Kwan O Station",
    mtr_line_zh: "將軍澳綫",
    mtr_line_en: "Tseung Kwan O Line",
    mtr_latitude: 22.3074549,
    mtr_longitude: 114.2600174,
    walk_minutes: 10,
    directions_zh: "出站後一直向南行，往海旁方向，去將軍澳南公園。",
    directions_en: "Leave the station and walk straight south towards the waterfront to Tseung Kwan O South Park.",
  },
  {
    venue_id: "venue_np",
    name_zh: "北角樂區單車亭",
    name_en: "North Point Loco Bike Kiosk",
    district_zh: "北角",
    district_en: "North Point",
    address_zh: "北角電照街39–41號",
    address_en: "39–41 Tin Chiu Street, North Point",
    opening_hours: "11:00 – 20:00",
    latitude: 22.293779,
    longitude: 114.202947,
    maps_url: "https://maps.app.goo.gl/7cd6JSwq8VjUn3Zr8",
    mtr_station_zh: "北角站",
    mtr_station_en: "North Point Station",
    mtr_line_zh: "港島綫 / 將軍澳綫",
    mtr_line_en: "Island Line / Tseung Kwan O Line",
    mtr_latitude: 22.2912707,
    mtr_longitude: 114.2004947,
    walk_minutes: 6,
    directions_zh: "出站後往東北面海旁方向行，入電照街，單車亭喺 39–41 號。",
    directions_en:
      "Leave the station heading north-east towards the waterfront into Tin Chiu Street; the kiosk is at No. 39–41.",
  },
  {
    venue_id: "venue_klc",
    name_zh: "九龍城樂區單車亭",
    name_en: "Kowloon City Loco Bike Kiosk",
    district_zh: "九龍城",
    district_en: "Kowloon City",
    address_zh: "九龍九龍城賈炳達道賈炳達道公園單車亭",
    address_en: "Carpenter Road Park bike kiosk, Carpenter Road, Kowloon City",
    opening_hours: "平日 10:00 – 20:00 假日 9:00 – 20:00",
    latitude: 22.3316067,
    longitude: 114.1886791,
    maps_url: "https://maps.app.goo.gl/jS2R1CSJqXwMvAjLA",
    mtr_station_zh: "宋皇臺站",
    mtr_station_en: "Sung Wong Toi Station",
    mtr_line_zh: "屯馬綫",
    mtr_line_en: "Tuen Ma Line",
    mtr_latitude: 22.32591,
    mtr_longitude: 114.1913,
    walk_minutes: 11,
    directions_zh: "出站後向北行，去賈炳達道公園，單車亭喺公園單車場。",
    directions_en: "Leave the station heading north to Carpenter Road Park; the kiosk is at the park's cycling ground.",
  },
];

type Slot = { class_id: string; start_time: string; end_time: string };

const WEEKDAY_SLOTS: Slot[] = [
  { class_id: REGULAR_CLASS_ID, start_time: "11:00", end_time: "12:00" },
  { class_id: KIDS_CLASS_ID, start_time: "16:00", end_time: "17:00" },
  { class_id: KIDS_CLASS_ID, start_time: "17:15", end_time: "18:15" },
  { class_id: REGULAR_CLASS_ID, start_time: "19:00", end_time: "20:00" },
];

const WEEKEND_SLOTS: Slot[] = [
  { class_id: KIDS_CLASS_ID, start_time: "10:00", end_time: "11:00" },
  { class_id: KIDS_CLASS_ID, start_time: "11:15", end_time: "12:15" },
  { class_id: REGULAR_CLASS_ID, start_time: "14:00", end_time: "15:00" },
  { class_id: REGULAR_CLASS_ID, start_time: "15:15", end_time: "16:15" },
];

/** Which Venue runs on each weekday (0 = Monday) of each cycle week; Monday and Tuesday have no class. */
const ROTATION: Record<number, Array<string | null>> = {
  1: [null, null, "venue_np", "venue_tko", "venue_klc", "venue_tsw", "venue_ty"],
  2: [null, null, "venue_klc", "venue_np", "venue_tko", "venue_ty", "venue_tsw"],
};

const WEEKDAY_KEYS = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];

export type TimetableEntrySeed = Slot & {
  entry_id: string;
  venue_id: string;
  cycle_week: number;
  weekday: number;
};

export const TIMETABLE: TimetableEntrySeed[] = Object.entries(ROTATION).flatMap(([week, days]) =>
  days.flatMap((venueId, weekday) => {
    if (!venueId) return [];
    const slots = weekday >= 5 ? WEEKEND_SLOTS : WEEKDAY_SLOTS;
    return slots.map((slot) => ({
      ...slot,
      entry_id: `w${week}-${WEEKDAY_KEYS[weekday]}-${slot.start_time.replace(":", "")}-${venueId.replace("venue_", "")}`,
      venue_id: venueId,
      cycle_week: Number(week),
      weekday,
    }));
  })
);

/**
 * Creates or updates the catalogue, then opens the Timetable's first window of Sessions.
 * Safe to run again: it updates by stable keys and never duplicates. A Class's on-sale
 * status and any pause set by an admin are left as they are.
 */
export const seed = internalMutationGeneric({
  args: { today: v.optional(v.string()) },
  returns: v.object({
    classes: v.number(),
    venues: v.number(),
    timetable_entries: v.number(),
    sessions_opened: v.number(),
    terms_published: v.boolean(),
  }),
  handler: async (ctx, args) => {
    const now = Date.now();

    for (const cls of CLASSES) {
      const existing = await ctx.db
        .query("classes")
        .withIndex("by_class_id", (q) => q.eq("class_id", cls.class_id))
        .first();
      if (existing) {
        await ctx.db.patch(existing._id, cls);
      } else {
        await ctx.db.insert("classes", { ...cls, status: "active", created_at: now });
      }
    }

    for (const venue of VENUES) {
      const existing = await ctx.db
        .query("venues")
        .withIndex("by_venue_id", (q) => q.eq("venue_id", venue.venue_id))
        .first();
      if (existing) {
        await ctx.db.patch(existing._id, { ...venue, updated_at: now });
        // Sessions already open keep up with the Venue (name and map link).
        await refreshUpcomingSessionLocations(ctx, venue, hkDate(now));
      } else {
        await ctx.db.insert("venues", { ...venue, created_at: now });
      }
    }

    const wanted = new Set(TIMETABLE.map((entry) => entry.entry_id));
    for (const existing of await ctx.db.query("timetable_entries").collect()) {
      if (!wanted.has(existing.entry_id)) {
        await ctx.db.delete(existing._id);
      }
    }
    for (const entry of TIMETABLE) {
      const existing = await ctx.db
        .query("timetable_entries")
        .withIndex("by_entry_id", (q) => q.eq("entry_id", entry.entry_id))
        .first();
      if (existing) {
        await ctx.db.patch(existing._id, entry);
      } else {
        await ctx.db.insert("timetable_entries", { ...entry, created_at: now });
      }
    }

    const settings = await ctx.db
      .query("timetable_settings")
      .withIndex("by_key", (q) => q.eq("key", "default"))
      .first();
    const cycle = {
      cycle_anchor: CYCLE_ANCHOR,
      first_date: FIRST_CLASS_DATE,
      cycle_weeks: CYCLE_WEEKS,
      window_days: WINDOW_DAYS,
    };
    if (settings) {
      await ctx.db.patch(settings._id, { ...cycle, updated_at: now });
    } else {
      await ctx.db.insert("timetable_settings", { key: "default", ...cycle, updated_at: now });
    }

    const sessionsOpened = await openTimetableSessions(ctx, now, args.today);

    // The waiver Customers accept when booking (content/terms/cycling-waiver.md).
    const termsPublished = await publishTermsIfChanged(
      ctx,
      { version: CYCLING_WAIVER_VERSION, content: CYCLING_WAIVER_TEXT },
      now
    );

    return {
      classes: CLASSES.length,
      venues: VENUES.length,
      timetable_entries: TIMETABLE.length,
      sessions_opened: sessionsOpened,
      terms_published: termsPublished,
    };
  },
});
