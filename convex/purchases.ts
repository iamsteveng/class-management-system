import { mutationGeneric } from "convex/server";
import { v } from "convex/values";

/**
 * Patch the manychat_subscriber_id on a purchase record for auditing.
 */
export const updateManychatSubscriberId = mutationGeneric({
  args: {
    purchase_id: v.id("purchases"),
    manychat_subscriber_id: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await ctx.db.patch(args.purchase_id, {
      manychat_subscriber_id: args.manychat_subscriber_id,
    });
    return null;
  },
});

/**
 * Shared mutation: creates a purchase record.
 * Used by both S3 ingestion and the future direct payment gateway.
 *
 * Duplicate detection: if the same order_id + class_id already exists, returns
 * the existing purchase._id (idempotent — safe for reprocessing).
 */
export const createPurchase = mutationGeneric({
  args: {
    order_id: v.string(),
    customer_mobile: v.string(),
    participant_count: v.number(),
    class_id: v.optional(v.string()),
    source: v.union(v.literal("s3"), v.literal("payment_gateway"), v.literal("airwallex")),
    unit_price: v.optional(v.number()),
    total_price: v.optional(v.number()),
    purchase_datetime: v.string(),
    slot_index: v.optional(v.number()),
  },
  returns: v.id("purchases"),
  handler: async (ctx, args) => {
    const effectiveSlotIndex = args.slot_index ?? 0;

    // Duplicate detection: same order_id + class_id + slot_index
    const existing = await ctx.db
      .query("purchases")
      .withIndex("by_order_class_slot", (q) => q.eq("order_id", args.order_id))
      .filter((q) =>
        q.and(
          args.class_id
            ? q.eq(q.field("class_id"), args.class_id)
            : q.eq(q.field("class_id"), undefined),
          q.eq(q.field("slot_index"), effectiveSlotIndex)
        )
      )
      .first();

    if (existing) {
      return existing._id;
    }

    return await ctx.db.insert("purchases", {
      order_id: args.order_id,
      customer_mobile: args.customer_mobile,
      purchase_datetime: args.purchase_datetime,
      participant_count: args.participant_count,
      status: "pending_terms",
      token: crypto.randomUUID(),
      class_id: args.class_id,
      source: args.source,
      unit_price: args.unit_price,
      total_price: args.total_price,
      slot_index: effectiveSlotIndex,
      created_at: Date.now(),
    });
  },
});
