import { queryGeneric } from "convex/server";
import { v } from "convex/values";

import { resolveAppBaseUrl } from "../lib/appBaseUrl";

const upcomingSessionValidator = v.object({
  session_id: v.string(),
  location_zh: v.string(),
  location_en: v.optional(v.string()),
  end_time: v.optional(v.string()),
  date: v.string(),
  time: v.string(),
  quota_available: v.number(),
});

type SessionDoc = {
  session_id: string;
  location_zh?: string;
  location_en?: string;
  end_time?: string;
  date: string;
  time: string;
  quota_defined: number;
  quota_used: number;
  status: "scheduled" | "completed" | "cancelled";
};

/** Scheduled Sessions dated today or later, soonest first, as shown to Customers. */
function toUpcomingSessions(sessions: SessionDoc[]) {
  const today = new Date().toISOString().split("T")[0];

  return sessions
    .filter((session) => session.status === "scheduled" && session.date >= today)
    .map((session) => ({
      session_id: session.session_id,
      location_zh: session.location_zh ?? "",
      location_en: session.location_en,
      end_time: session.end_time,
      date: session.date,
      time: session.time,
      quota_available: Math.max(0, session.quota_defined - session.quota_used),
    }))
    .sort((left, right) =>
      `${left.date}T${left.time}`.localeCompare(`${right.date}T${right.time}`)
    );
}

/** Absolute Purchase Link for a Class, or undefined when APP_BASE_URL is not configured. */
function buildPurchaseUrl(classId: string): string | undefined {
  let baseUrl: string;
  try {
    baseUrl = resolveAppBaseUrl(process.env.APP_BASE_URL);
  } catch {
    return undefined;
  }
  return `${baseUrl}/apply/${encodeURIComponent(classId)}`;
}

/**
 * Classes currently on sale — active and sold on this site, via Airwallex or for free —
 * with everything a Class card shows, including its Purchase Link and upcoming Sessions.
 */
export const listClassesOnSale = queryGeneric({
  args: {},
  returns: v.array(
    v.object({
      class_id: v.string(),
      name_zh: v.string(),
      name_en: v.optional(v.string()),
      description_zh: v.optional(v.string()),
      description_en: v.optional(v.string()),
      duration_minutes: v.optional(v.number()),
      image_url: v.optional(v.string()),
      purchase_url: v.optional(v.string()),
      airwallex_price: v.optional(v.number()),
      airwallex_currency: v.optional(v.string()),
      airwallex_group_price: v.optional(v.number()),
      airwallex_group_min_qty: v.optional(v.number()),
      is_free: v.optional(v.boolean()),
      sessions: v.array(upcomingSessionValidator),
    })
  ),
  handler: async (ctx) => {
    const classes = await ctx.db.query("classes").collect();

    const onSale = classes
      .filter(
        (cls) =>
          cls.status === "active" &&
          (typeof cls.airwallex_price === "number" || cls.is_free === true)
      )
      .sort((left, right) => left.created_at - right.created_at);

    return Promise.all(
      onSale.map(async (cls) => {
        const sessions = await ctx.db
          .query("sessions")
          .withIndex("by_class_id", (q) => q.eq("class_id", cls.class_id))
          .collect();

        return {
          class_id: cls.class_id,
          name_zh: cls.name_zh ?? "",
          name_en: cls.name_en,
          description_zh: cls.description_zh,
          description_en: cls.description_en,
          duration_minutes: cls.duration_minutes,
          image_url: cls.image_url,
          purchase_url: buildPurchaseUrl(cls.class_id),
          airwallex_price: cls.airwallex_price,
          airwallex_currency: cls.airwallex_currency,
          airwallex_group_price: cls.airwallex_group_price,
          airwallex_group_min_qty: cls.airwallex_group_min_qty,
          is_free: cls.is_free,
          sessions: toUpcomingSessions(sessions),
        };
      })
    );
  },
});

export const getAvailableClasses = queryGeneric({
  args: {},
  returns: v.array(
    v.object({
      class_id: v.string(),
      class_name: v.string(),
    })
  ),
  handler: async (ctx) => {
    const classes = await ctx.db.query("classes").collect();

    return classes
      .filter((cls) => cls.status === "active")
      .map((cls) => ({
        class_id: cls.class_id,
        class_name: cls.name_zh ?? "",
      }))
      .sort((left, right) => {
        const ORDER = ["class_cycling_fundamentals", "class_city_guided_tour"];
        const li = ORDER.indexOf(left.class_id);
        const ri = ORDER.indexOf(right.class_id);
        if (li !== -1 && ri !== -1) return li - ri;
        if (li !== -1) return -1;
        if (ri !== -1) return 1;
        return left.class_name.localeCompare(right.class_name, undefined, { sensitivity: "base" });
      });
  },
});

export const getAvailableSessionsByClass = queryGeneric({
  args: {
    class_id: v.string(),
  },
  returns: v.array(upcomingSessionValidator),
  handler: async (ctx, args) => {
    const sessions = await ctx.db
      .query("sessions")
      .withIndex("by_class_id", (q) => q.eq("class_id", args.class_id))
      .collect();

    return toUpcomingSessions(sessions);
  },
});
