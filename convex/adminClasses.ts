import { mutationGeneric, queryGeneric } from "convex/server";
import { v } from "convex/values";

export const getClassListPageData = queryGeneric({
  args: {},
  returns: v.array(
    v.object({
      class_id: v.string(),
      class_name: v.string(),
      name_en: v.optional(v.string()),
      description: v.optional(v.string()),
      total_sessions: v.number(),
      status: v.union(v.literal("active"), v.literal("inactive")),
      payment_url: v.optional(v.string()),
      airwallex_price: v.optional(v.number()),
      airwallex_currency: v.optional(v.string()),
      airwallex_group_price: v.optional(v.number()),
      airwallex_group_min_qty: v.optional(v.number()),
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
      class_name: cls.name_zh ?? "",
      name_en: cls.name_en,
      description: cls.description,
      total_sessions: sessionCountByClassId.get(cls.class_id) ?? 0,
      status: cls.status,
      payment_url: cls.payment_url,
      airwallex_price: cls.airwallex_price,
      airwallex_currency: cls.airwallex_currency,
      airwallex_group_price: cls.airwallex_group_price,
      airwallex_group_min_qty: cls.airwallex_group_min_qty,
    }));
  },
});

export const createClass = mutationGeneric({
  args: {
    name_zh: v.string(),
    name_en: v.optional(v.string()),
    description: v.optional(v.string()),
    payment_url: v.optional(v.string()),
    airwallex_price: v.optional(v.number()),
    airwallex_currency: v.optional(v.string()),
    airwallex_group_price: v.optional(v.number()),
    airwallex_group_min_qty: v.optional(v.number()),
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
      name_zh: args.name_zh.trim(),
      name_en: args.name_en?.trim() || undefined,
      description: args.description?.trim(),
      payment_url: args.payment_url?.trim() || undefined,
      airwallex_price: args.airwallex_price,
      airwallex_currency: args.airwallex_currency?.trim() || undefined,
      airwallex_group_price: args.airwallex_group_price,
      airwallex_group_min_qty: args.airwallex_group_min_qty,
      status: "active",
      created_at: now,
    });

    await ctx.db.insert("audit_logs", {
      admin_id: admin?._id,
      action: "class_created",
      entity_type: "classes",
      entity_id: classId,
      metadata: {
        name_zh: args.name_zh.trim(),
        description: args.description?.trim(),
      },
      created_at: now,
    });

    return { class_id: classId };
  },
});

export const updateClass = mutationGeneric({
  args: {
    class_id: v.string(),
    name_zh: v.string(),
    name_en: v.optional(v.string()),
    description: v.optional(v.string()),
    payment_url: v.optional(v.string()),
    airwallex_price: v.optional(v.number()),
    airwallex_currency: v.optional(v.string()),
    airwallex_group_price: v.optional(v.number()),
    airwallex_group_min_qty: v.optional(v.number()),
    admin_username: v.string(),
  },
  returns: v.object({
    class_id: v.string(),
  }),
  handler: async (ctx, args) => {
    const classRecord = await ctx.db
      .query("classes")
      .withIndex("by_class_id", (q) => q.eq("class_id", args.class_id))
      .first();

    if (!classRecord) {
      throw new Error("Class not found.");
    }

    const admin = await ctx.db
      .query("admins")
      .withIndex("by_username", (q) => q.eq("username", args.admin_username))
      .first();

    if (!admin || admin.role !== "super_admin") {
      throw new Error("Only super admins can edit classes.");
    }

    const now = Date.now();
    const nextNameZh = args.name_zh.trim();
    const nextNameEn = args.name_en?.trim() || undefined;
    const nextDescription = args.description?.trim() ?? "";
    const nextPaymentUrl = args.payment_url?.trim() || undefined;

    await ctx.db.patch(classRecord._id, {
      name_zh: nextNameZh,
      name_en: nextNameEn,
      description: nextDescription,
      payment_url: nextPaymentUrl,
      airwallex_price: args.airwallex_price,
      airwallex_currency: args.airwallex_currency?.trim() || undefined,
      airwallex_group_price: args.airwallex_group_price,
      airwallex_group_min_qty: args.airwallex_group_min_qty,
    });

    await ctx.db.insert("audit_logs", {
      admin_id: admin._id,
      action: "class_updated",
      entity_type: "classes",
      entity_id: classRecord.class_id,
      metadata: {
        previous_name_zh: classRecord.name_zh,
        next_name_zh: nextNameZh,
        previous_description: classRecord.description ?? "",
        next_description: nextDescription,
      },
      created_at: now,
    });

    return { class_id: classRecord.class_id };
  },
});

export const cancelClass = mutationGeneric({
  args: {
    class_id: v.string(),
    admin_username: v.string(),
  },
  returns: v.object({
    class_id: v.string(),
  }),
  handler: async (ctx, args) => {
    const classRecord = await ctx.db
      .query("classes")
      .withIndex("by_class_id", (q) => q.eq("class_id", args.class_id))
      .first();

    if (!classRecord) {
      throw new Error("Class not found.");
    }

    const admin = await ctx.db
      .query("admins")
      .withIndex("by_username", (q) => q.eq("username", args.admin_username))
      .first();

    if (!admin || admin.role !== "super_admin") {
      throw new Error("Only super admins can cancel classes.");
    }

    const today = new Date().toISOString().slice(0, 10);
    const sessions = await ctx.db
      .query("sessions")
      .withIndex("by_class_id", (q) => q.eq("class_id", args.class_id))
      .collect();

    const hasActiveFutureSessions = sessions.some(
      (session) => session.status !== "cancelled" && session.date >= today
    );

    if (hasActiveFutureSessions) {
      throw new Error(
        "Cannot cancel class with active future sessions. Cancel those sessions first."
      );
    }

    if (classRecord.status === "inactive") {
      return { class_id: classRecord.class_id };
    }

    const now = Date.now();
    await ctx.db.patch(classRecord._id, {
      status: "inactive",
    });

    await ctx.db.insert("audit_logs", {
      admin_id: admin._id,
      action: "class_cancelled",
      entity_type: "classes",
      entity_id: classRecord.class_id,
      metadata: {
        previous_status: classRecord.status,
        next_status: "inactive",
      },
      created_at: now,
    });

    return { class_id: classRecord.class_id };
  },
});
