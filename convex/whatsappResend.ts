import { queryGeneric } from "convex/server";
import { v } from "convex/values";

export const listFailedWhatsappSends = queryGeneric({
  args: {},
  returns: v.array(
    v.object({
      _id: v.id("purchases"),
      customer_mobile: v.string(),
      order_id: v.string(),
      created_at: v.number(),
    })
  ),
  handler: async (ctx) => {
    const pending = await ctx.db
      .query("purchases")
      .withIndex("by_status", (q) => q.eq("status", "pending_terms"))
      .collect();

    return pending
      .filter((p) => !p.manychat_subscriber_id)
      .map((p) => ({
        _id: p._id,
        customer_mobile: p.customer_mobile,
        order_id: p.order_id,
        created_at: p.created_at,
      }));
  },
});
