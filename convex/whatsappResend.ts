import { makeFunctionReference } from "convex/server";
import { v } from "convex/values";

import { serverAction, serverQuery } from "./serverOnly";

export const listFailedWhatsappSends = serverQuery({
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

/** Admin resend of the Token WhatsApp for a purchase whose first send failed. */
export const resendPurchaseConfirmation = serverAction({
  args: { purchase_id: v.id("purchases") },
  returns: v.null(),
  handler: async (ctx, args) => {
    await ctx.runAction(makeFunctionReference<"action">("purchaseConfirmation:sendPurchaseConfirmation"), {
      purchase_id: args.purchase_id,
    });
    return null;
  },
});

/** The Token of a purchase, so an admin can open its terms page. */
export const getPurchaseToken = serverQuery({
  args: { purchase_id: v.id("purchases") },
  returns: v.union(v.null(), v.object({ token: v.string() })),
  handler: async (ctx, args) => {
    const purchase = await ctx.db.get(args.purchase_id);
    return purchase ? { token: purchase.token } : null;
  },
});
