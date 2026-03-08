import { queryGeneric } from "convex/server";
import { v } from "convex/values";

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
        class_name: cls.name,
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
      location: v.string(),
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
        location: session.location,
        date: session.date,
        time: session.time,
        quota_available: Math.max(0, session.quota_defined - session.quota_used),
      }))
      .sort((left, right) =>
        `${left.date}T${left.time}`.localeCompare(`${right.date}T${right.time}`)
      );
  },
});
