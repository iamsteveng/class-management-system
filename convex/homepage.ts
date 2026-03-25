import { queryGeneric } from "convex/server";
import { v } from "convex/values";

export const listClassesWithPaymentUrl = queryGeneric({
  args: {},
  returns: v.array(
    v.object({
      class_id: v.string(),
      name_zh: v.string(),
      name_en: v.optional(v.string()),
      description: v.optional(v.string()),
      payment_url: v.string(),
    })
  ),
  handler: async (ctx) => {
    const classes = await ctx.db.query("classes").collect();

    return classes
      .filter(
        (cls) =>
          cls.status === "active" &&
          typeof cls.payment_url === "string" &&
          cls.payment_url.length > 0
      )
      .map((cls) => ({
        class_id: cls.class_id,
        name_zh: cls.name_zh ?? "",
        name_en: cls.name_en,
        description: cls.description,
        payment_url: cls.payment_url as string,
      }));
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
      .sort((left, right) =>
        left.class_name.localeCompare(right.class_name, undefined, {
          sensitivity: "base",
        })
      );
  },
});

export const getAvailableSessionsByClass = queryGeneric({
  args: {
    class_id: v.string(),
  },
  returns: v.array(
    v.object({
      session_id: v.string(),
      location_zh: v.string(),
      location_en: v.optional(v.string()),
      end_time: v.optional(v.string()),
      date: v.string(),
      time: v.string(),
      quota_available: v.number(),
    })
  ),
  handler: async (ctx, args) => {
    const sessions = await ctx.db
      .query("sessions")
      .withIndex("by_class_id", (q) => q.eq("class_id", args.class_id))
      .collect();

    return sessions
      .filter((session) => session.status === "scheduled")
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
  },
});
