import { mutationGeneric, queryGeneric } from "convex/server";
import type { GenericDataModel, GenericMutationCtx } from "convex/server";
import { v } from "convex/values";
import type { GenericId } from "convex/values";

/**
 * Image URLs are consumed outside this site (e.g. the mobile app), so they must be
 * absolute http(s) URLs. Returns the trimmed URL, or undefined when blank.
 */
function normalizeImageUrl(imageUrl: string | undefined): string | undefined {
  const trimmed = imageUrl?.trim();
  if (!trimmed) {
    return undefined;
  }
  // A full URL, or a path on this site such as /images/revamp/class-kids.jpg
  if (!/^https?:\/\/[^/\s]+/i.test(trimmed) && !/^\/[^/\s]/.test(trimmed)) {
    throw new Error("Image URL must be a full URL starting with https:// or a path starting with /");
  }
  return trimmed;
}

export const getClassListPageData = queryGeneric({
  args: {},
  returns: v.array(
    v.object({
      class_id: v.string(),
      class_name: v.string(),
      name_en: v.optional(v.string()),
      description_zh: v.optional(v.string()),
      description_en: v.optional(v.string()),
      duration_minutes: v.optional(v.number()),
      image_url: v.optional(v.string()),
      total_sessions: v.number(),
      status: v.union(v.literal("active"), v.literal("inactive")),
      airwallex_price: v.optional(v.number()),
      airwallex_currency: v.optional(v.string()),
      airwallex_group_price: v.optional(v.number()),
      airwallex_group_min_qty: v.optional(v.number()),
      is_free: v.optional(v.boolean()),
      age_min: v.optional(v.number()),
      age_max: v.optional(v.number()),
      class_size: v.optional(v.number()),
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
      description_zh: cls.description_zh,
      description_en: cls.description_en,
      duration_minutes: cls.duration_minutes,
      image_url: cls.image_url,
      total_sessions: sessionCountByClassId.get(cls.class_id) ?? 0,
      status: cls.status,
      airwallex_price: cls.airwallex_price,
      airwallex_currency: cls.airwallex_currency,
      airwallex_group_price: cls.airwallex_group_price,
      airwallex_group_min_qty: cls.airwallex_group_min_qty,
      is_free: cls.is_free,
      age_min: cls.age_min,
      age_max: cls.age_max,
      class_size: cls.class_size,
    }));
  },
});

export const createClass = mutationGeneric({
  args: {
    name_zh: v.string(),
    name_en: v.optional(v.string()),
    description_zh: v.optional(v.string()),
    description_en: v.optional(v.string()),
    duration_minutes: v.optional(v.number()),
    image_url: v.optional(v.string()),
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
      description_zh: args.description_zh?.trim() || undefined,
      description_en: args.description_en?.trim() || undefined,
      duration_minutes: args.duration_minutes,
      image_url: normalizeImageUrl(args.image_url),
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
        description_zh: args.description_zh?.trim(),
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
    description_zh: v.optional(v.string()),
    description_en: v.optional(v.string()),
    duration_minutes: v.optional(v.number()),
    image_url: v.optional(v.string()),
    airwallex_price: v.optional(v.number()),
    airwallex_currency: v.optional(v.string()),
    airwallex_group_price: v.optional(v.number()),
    airwallex_group_min_qty: v.optional(v.number()),
    is_free: v.optional(v.boolean()),
    age_min: v.optional(v.number()),
    age_max: v.optional(v.number()),
    class_size: v.optional(v.number()),
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

    if (
      args.age_min !== undefined &&
      args.age_max !== undefined &&
      args.age_min > args.age_max
    ) {
      throw new Error("The youngest age must not be above the oldest age.");
    }

    const now = Date.now();
    const nextNameZh = args.name_zh.trim();
    const nextNameEn = args.name_en?.trim() || undefined;
    const nextDescriptionZh = args.description_zh?.trim() || undefined;

    await ctx.db.patch(classRecord._id, {
      name_zh: nextNameZh,
      name_en: nextNameEn,
      description_zh: nextDescriptionZh,
      description_en: args.description_en?.trim() || undefined,
      duration_minutes: args.duration_minutes,
      image_url: normalizeImageUrl(args.image_url),
      airwallex_price: args.airwallex_price,
      airwallex_currency: args.airwallex_currency?.trim() || undefined,
      airwallex_group_price: args.airwallex_group_price,
      airwallex_group_min_qty: args.airwallex_group_min_qty,
      is_free: args.is_free === true ? true : undefined,
      age_min: args.age_min,
      age_max: args.age_max,
      class_size: args.class_size,
    });

    await ctx.db.insert("audit_logs", {
      admin_id: admin._id,
      action: "class_updated",
      entity_type: "classes",
      entity_id: classRecord.class_id,
      metadata: {
        previous_name_zh: classRecord.name_zh,
        next_name_zh: nextNameZh,
        previous_description_zh: classRecord.description_zh ?? "",
        next_description_zh: nextDescriptionZh ?? "",
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
