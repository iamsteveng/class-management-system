import { mutationGeneric, queryGeneric } from "convex/server";
import { v } from "convex/values";

export const getPurchaseForRefund = queryGeneric({
  args: { purchase_id: v.id("purchases") },
  returns: v.union(
    v.object({
      _id: v.id("purchases"),
      order_id: v.string(),
      customer_mobile: v.string(),
      source: v.optional(
        v.union(v.literal("s3"), v.literal("payment_gateway"), v.literal("airwallex"), v.literal("free"))
      ),
      total_price: v.optional(v.number()),
      currency: v.optional(v.string()),
      status: v.union(
        v.literal("pending_terms"),
        v.literal("confirmation_sent"),
        v.literal("terms_accepted"),
        v.literal("cancelled")
      ),
      refund_status: v.optional(
        v.union(v.literal("none"), v.literal("refunded"), v.literal("failed"))
      ),
    }),
    v.null()
  ),
  handler: async (ctx, args) => {
    const p = await ctx.db.get(args.purchase_id);
    if (!p) return null;
    return {
      _id: p._id,
      order_id: p.order_id,
      customer_mobile: p.customer_mobile,
      source: p.source,
      total_price: p.total_price,
      currency: p.currency,
      status: p.status,
      refund_status: p.refund_status,
    };
  },
});

export const applyCancellation = mutationGeneric({
  args: {
    purchase_id: v.id("purchases"),
    admin_username: v.string(),
    refund_id: v.string(),
    amount: v.number(),
    currency: v.string(),
  },
  returns: v.object({ participants_removed: v.number() }),
  handler: async (ctx, args) => {
    const purchase = await ctx.db.get(args.purchase_id);
    if (!purchase) throw new Error(`Purchase ${args.purchase_id} not found.`);

    const admin = await ctx.db
      .query("admins")
      .withIndex("by_username", (q) => q.eq("username", args.admin_username))
      .first();

    const participants = await ctx.db
      .query("participants")
      .filter((q) => q.eq(q.field("purchase_id"), args.purchase_id))
      .collect();

    const quotaDecrements = new Map<string, number>();
    for (const p of participants) {
      quotaDecrements.set(p.session_id, (quotaDecrements.get(p.session_id) ?? 0) + 1);
    }

    for (const p of participants) {
      await ctx.db.delete(p._id);
    }

    for (const [session_id, count] of quotaDecrements) {
      const session = await ctx.db
        .query("sessions")
        .withIndex("by_session_id", (q) => q.eq("session_id", session_id))
        .first();
      if (session) {
        await ctx.db.patch(session._id, {
          quota_used: Math.max(0, session.quota_used - count),
        });
      }
    }

    await ctx.db.patch(args.purchase_id, {
      status: "cancelled",
      refund_status: "refunded",
      refunded_at: Date.now(),
      airwallex_refund_id: args.refund_id,
    });

    await ctx.db.insert("audit_logs", {
      admin_id: admin?._id,
      action: "purchase.refund",
      entity_type: "purchase",
      entity_id: String(args.purchase_id),
      metadata: {
        intent_id: purchase.order_id,
        refund_id: args.refund_id,
        amount: args.amount,
        currency: args.currency,
        participants_removed: participants.length,
      },
      created_at: Date.now(),
    });

    return { participants_removed: participants.length };
  },
});
