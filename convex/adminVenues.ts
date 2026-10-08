import { mutationGeneric, queryGeneric, type GenericMutationCtx } from "convex/server";
import { v } from "convex/values";

import type { DataModel } from "./_generated/dataModel";
import { hkDate } from "./timetable";
import { sessionLocationFromVenue, toVenueFields, venueValidator, type VenueFields } from "./venues";

const venueInput = {
  name_zh: v.string(),
  name_en: v.optional(v.string()),
  district_zh: v.string(),
  district_en: v.optional(v.string()),
  address_zh: v.string(),
  address_en: v.optional(v.string()),
  opening_hours: v.optional(v.string()),
  latitude: v.number(),
  longitude: v.number(),
  mtr_station_zh: v.optional(v.string()),
  mtr_station_en: v.optional(v.string()),
  mtr_line_zh: v.optional(v.string()),
  mtr_line_en: v.optional(v.string()),
  mtr_latitude: v.optional(v.number()),
  mtr_longitude: v.optional(v.number()),
  walk_minutes: v.optional(v.number()),
  directions_zh: v.optional(v.string()),
  directions_en: v.optional(v.string()),
};

type VenueInput = Omit<VenueFields, "venue_id">;

async function requireSuperAdmin(ctx: GenericMutationCtx<DataModel>, username: string) {
  const admin = await ctx.db
    .query("admins")
    .withIndex("by_username", (q) => q.eq("username", username))
    .first();
  if (!admin || admin.role !== "super_admin") {
    throw new Error("Only super admins can manage venues.");
  }
  return admin;
}

/** Trims text, drops empty optional text, and checks the required parts are there. */
function cleanVenueInput(input: VenueInput): VenueInput {
  const text = (s?: string) => s?.trim() || undefined;
  const cleaned = {
    name_zh: input.name_zh.trim(),
    name_en: text(input.name_en),
    district_zh: input.district_zh.trim(),
    district_en: text(input.district_en),
    address_zh: input.address_zh.trim(),
    address_en: text(input.address_en),
    opening_hours: text(input.opening_hours),
    latitude: input.latitude,
    longitude: input.longitude,
    mtr_station_zh: text(input.mtr_station_zh),
    mtr_station_en: text(input.mtr_station_en),
    mtr_line_zh: text(input.mtr_line_zh),
    mtr_line_en: text(input.mtr_line_en),
    mtr_latitude: input.mtr_latitude,
    mtr_longitude: input.mtr_longitude,
    walk_minutes: input.walk_minutes,
    directions_zh: text(input.directions_zh),
    directions_en: text(input.directions_en),
  };
  if (!cleaned.name_zh || !cleaned.district_zh || !cleaned.address_zh) {
    throw new Error("Name, district and address are required.");
  }
  if (
    !Number.isFinite(cleaned.latitude) ||
    !Number.isFinite(cleaned.longitude) ||
    Math.abs(cleaned.latitude) > 90 ||
    Math.abs(cleaned.longitude) > 180
  ) {
    throw new Error("Latitude or longitude is out of range.");
  }
  return cleaned;
}

export const listVenuesForAdmin = queryGeneric({
  args: {},
  returns: v.array(v.object({ venue: venueValidator, upcoming_sessions: v.number() })),
  handler: async (ctx) => {
    const today = hkDate(Date.now());
    const venues = (await ctx.db.query("venues").collect()).sort((a, b) => a.created_at - b.created_at);
    return Promise.all(
      venues.map(async (venue) => {
        const sessions = await ctx.db
          .query("sessions")
          .withIndex("by_venue_id", (q) => q.eq("venue_id", venue.venue_id))
          .collect();
        return {
          venue: toVenueFields(venue),
          upcoming_sessions: sessions.filter((s) => s.status === "scheduled" && s.date >= today).length,
        };
      })
    );
  },
});

export const getVenue = queryGeneric({
  args: { venue_id: v.string() },
  returns: v.union(v.null(), venueValidator),
  handler: async (ctx, args) => {
    const venue = await ctx.db
      .query("venues")
      .withIndex("by_venue_id", (q) => q.eq("venue_id", args.venue_id))
      .first();
    return venue ? toVenueFields(venue) : null;
  },
});

export const createVenue = mutationGeneric({
  args: { ...venueInput, admin_username: v.string() },
  returns: v.object({ venue_id: v.string() }),
  handler: async (ctx, args) => {
    const { admin_username, ...input } = args;
    const admin = await requireSuperAdmin(ctx, admin_username);
    const venueId = `venue_${crypto.randomUUID()}`;
    const now = Date.now();
    await ctx.db.insert("venues", { venue_id: venueId, ...cleanVenueInput(input), created_at: now });
    await ctx.db.insert("audit_logs", {
      admin_id: admin._id,
      action: "venue_created",
      entity_type: "venues",
      entity_id: venueId,
      metadata: { name_zh: input.name_zh },
      created_at: now,
    });
    return { venue_id: venueId };
  },
});

/**
 * Updates a Venue. Its upcoming scheduled Sessions take the new name and map position,
 * so what Customers and Participants see stays in step; past Sessions keep theirs.
 */
export const updateVenue = mutationGeneric({
  args: { ...venueInput, venue_id: v.string(), admin_username: v.string() },
  returns: v.object({ venue_id: v.string(), sessions_updated: v.number() }),
  handler: async (ctx, args) => {
    const { admin_username, venue_id, ...input } = args;
    const admin = await requireSuperAdmin(ctx, admin_username);
    const venue = await ctx.db
      .query("venues")
      .withIndex("by_venue_id", (q) => q.eq("venue_id", venue_id))
      .first();
    if (!venue) throw new Error("Venue not found.");

    const now = Date.now();
    const cleaned = cleanVenueInput(input);
    await ctx.db.patch(venue._id, { ...cleaned, updated_at: now });

    const today = hkDate(now);
    const sessions = await ctx.db
      .query("sessions")
      .withIndex("by_venue_id", (q) => q.eq("venue_id", venue_id))
      .collect();
    let updated = 0;
    for (const session of sessions) {
      if (session.status !== "scheduled" || session.date < today) continue;
      await ctx.db.patch(session._id, sessionLocationFromVenue({ venue_id, ...cleaned }));
      updated++;
    }

    await ctx.db.insert("audit_logs", {
      admin_id: admin._id,
      action: "venue_updated",
      entity_type: "venues",
      entity_id: venue_id,
      metadata: { previous_name_zh: venue.name_zh, next_name_zh: cleaned.name_zh, sessions_updated: updated },
      created_at: now,
    });
    return { venue_id, sessions_updated: updated };
  },
});
