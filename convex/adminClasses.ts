import { mutationGeneric, queryGeneric } from "convex/server";
import { v } from "convex/values";

export const getClassListPageData = queryGeneric({
  args: {},
  returns: v.array(
    v.object({
      class_id: v.string(),
      class_name: v.string(),
      total_sessions: v.number(),
      status: v.union(v.literal("active"), v.literal("inactive")),
    })
  ),
  handler: async (ctx) => {
    const classes = await ctx.db.query("classes").collect();
    const sessions = await ctx.db.query("sessions").collect();

    const sessionCountByClassId = new Map<string, number>();
    for (const session of sessions) {
      const count = sessionCountByClassId.get(session.class_id) ?? 0;
      sessionCountByClassId.set(session.class_id, count + 1);
    }

    return classes.map((cls) => ({
      class_id: cls.class_id,
      class_name: cls.name,
      total_sessions: sessionCountByClassId.get(cls.class_id) ?? 0,
      status: cls.status,
    }));
  },
});

export const createClass = mutationGeneric({
  args: {
    name: v.string(),
    description: v.optional(v.string()),
    admin_username: v.string(),
  },
  returns: v.object({
    class_id: v.string(),
  }),
  handler: async (ctx, args) => {
    const now = Date.now();
    const classId = crypto.randomUUID();

    const admin = await ctx.db
      .query("admins")
      .withIndex("by_username", (q) => q.eq("username", args.admin_username))
      .first();

    await ctx.db.insert("classes", {
      class_id: classId,
      name: args.name.trim(),
      description: args.description?.trim(),
      status: "active",
      created_at: now,
    });

    await ctx.db.insert("audit_logs", {
      admin_id: admin?._id,
      action: "class_created",
      entity_type: "classes",
      entity_id: classId,
      metadata: {
        name: args.name.trim(),
        description: args.description?.trim(),
      },
      created_at: now,
    });

    return { class_id: classId };
  },
});
