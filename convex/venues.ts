import { queryGeneric } from "convex/server";
import { v } from "convex/values";

export const venueValidator = v.object({
  venue_id: v.string(),
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
});

export type VenueFields = {
  venue_id: string;
  name_zh: string;
  name_en?: string;
  district_zh: string;
  district_en?: string;
  address_zh: string;
  address_en?: string;
  opening_hours?: string;
  latitude: number;
  longitude: number;
  mtr_station_zh?: string;
  mtr_station_en?: string;
  mtr_line_zh?: string;
  mtr_line_en?: string;
  mtr_latitude?: number;
  mtr_longitude?: number;
  walk_minutes?: number;
  directions_zh?: string;
  directions_en?: string;
};

export function toVenueFields(venue: VenueFields): VenueFields {
  return {
    venue_id: venue.venue_id,
    name_zh: venue.name_zh,
    name_en: venue.name_en,
    district_zh: venue.district_zh,
    district_en: venue.district_en,
    address_zh: venue.address_zh,
    address_en: venue.address_en,
    opening_hours: venue.opening_hours,
    latitude: venue.latitude,
    longitude: venue.longitude,
    mtr_station_zh: venue.mtr_station_zh,
    mtr_station_en: venue.mtr_station_en,
    mtr_line_zh: venue.mtr_line_zh,
    mtr_line_en: venue.mtr_line_en,
    mtr_latitude: venue.mtr_latitude,
    mtr_longitude: venue.mtr_longitude,
    walk_minutes: venue.walk_minutes,
    directions_zh: venue.directions_zh,
    directions_en: venue.directions_en,
  };
}

/** Google Maps link to a Venue's position. */
export function venueMapsUrl(venue: Pick<VenueFields, "latitude" | "longitude">): string {
  return `https://www.google.com/maps/search/?api=1&query=${venue.latitude},${venue.longitude}`;
}

/**
 * The location fields a Session held at this Venue carries, so every page that shows a
 * Session's location keeps working whether or not the Session has a Venue.
 */
export function sessionLocationFromVenue(venue: VenueFields) {
  return {
    venue_id: venue.venue_id,
    location_zh: venue.name_zh,
    location_en: venue.name_en,
    google_maps_url: venueMapsUrl(venue),
  };
}

/** All Venues, for the public site and admin pickers. */
export const listVenues = queryGeneric({
  args: {},
  returns: v.array(venueValidator),
  handler: async (ctx) => {
    const venues = await ctx.db.query("venues").collect();
    return venues
      .sort((left, right) => left.created_at - right.created_at)
      .map(toVenueFields);
  },
});
