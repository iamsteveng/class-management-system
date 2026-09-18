import { mutationGeneric, queryGeneric } from "convex/server";
import type { GenericDataModel, GenericMutationCtx } from "convex/server";
import { v } from "convex/values";
import type { GenericId } from "convex/values";

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
      is_free: v.optional(v.boolean()),
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
      is_free: cls.is_free,
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
    is_free: v.optional(v.boolean()),
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
      is_free: args.is_free === true ? true : undefined,
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
    is_free: v.optional(v.boolean()),
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
      is_free: args.is_free === true ? true : undefined,
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

/**
 * Apply an availability change to a Class. Shared by setClassStatus and the
 * cancelClass alias so there is a single code path and one audit action.
 *
 * Availability is a visibility switch, not a lifecycle event: it controls
 * whether the Class is shown on the homepage and can be purchased. Existing
 * Participants, Tokens, Sessions and quota are untouched, and terms acceptance
 * for anyone who already paid keeps working.
 */
async function applyClassStatus(
  ctx: GenericMutationCtx<GenericDataModel>,
  args: { class_id: string; status: "active" | "inactive"; admin_username: string }
): Promise<{ class_id: string }> {
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
    throw new Error("Only super admins can change class availability.");
  }

  if (classRecord.status === args.status) {
    return { class_id: args.class_id };
  }

  const now = Date.now();
  await ctx.db.patch(classRecord._id as GenericId<"classes">, { status: args.status });

  await ctx.db.insert("audit_logs", {
    admin_id: admin._id as GenericId<"admins">,
    action: "class_status_changed",
    entity_type: "classes",
    entity_id: classRecord.class_id,
    metadata: {
      previous_status: classRecord.status,
      next_status: args.status,
    },
    created_at: now,
  });

  return { class_id: args.class_id };
}

export const setClassStatus = mutationGeneric({
  args: {
    class_id: v.string(),
    status: v.union(v.literal("active"), v.literal("inactive")),
    admin_username: v.string(),
  },
  returns: v.object({
    class_id: v.string(),
  }),
  handler: async (ctx, args) => applyClassStatus(ctx, args),
});

/** Alias kept for existing callers; sets availability to inactive. */
export const cancelClass = mutationGeneric({
  args: {
    class_id: v.string(),
    admin_username: v.string(),
  },
  returns: v.object({
    class_id: v.string(),
  }),
  handler: async (ctx, args) =>
    applyClassStatus(ctx, {
      class_id: args.class_id,
      status: "inactive",
      admin_username: args.admin_username,
    }),
});
