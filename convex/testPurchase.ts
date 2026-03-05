import { mutationGeneric } from "convex/server";
import { v } from "convex/values";

export const createTestPurchase = mutationGeneric({
  args: {
    customer_mobile: v.string(),
  },
  returns: v.object({
    purchase_id: v.id("purchases"),
    token: v.string(),
  }),
  handler: async (ctx, args) => {
    const now = Date.now();
    const token = crypto.randomUUID();
    const orderId = `ORD-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    const purchaseId = await ctx.db.insert("purchases", {
      order_id: orderId,
      customer_mobile: args.customer_mobile,
      purchase_datetime: new Date(now).toISOString(),
      participant_count: 2,
      status: "pending_terms",
      token: token,
      created_at: now,
    });

    return {
      purchase_id: purchaseId,
      token: token,
    };
  },
});
