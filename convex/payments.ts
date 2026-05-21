"use node";

import { actionGeneric, makeFunctionReference } from "convex/server";
import { v } from "convex/values";

export const createPurchaseFromAirwallex = actionGeneric({
  args: {
    intent_id: v.string(),
    class_id: v.string(),
    customer_mobile: v.string(),
    amount: v.number(),
    currency: v.string(),
    quantity: v.optional(v.number()),
  },
  returns: v.object({ tokens: v.array(v.string()), purchase_ids: v.array(v.string()) }),
  handler: async (ctx, args) => {
    const qty = Math.max(1, args.quantity ?? 1);
    const tokens: string[] = [];
    const purchase_ids: string[] = [];

    for (let i = 0; i < qty; i++) {
      const purchase_id = await ctx.runMutation(
        makeFunctionReference<"mutation">("purchases:createPurchase"),
        {
          order_id: args.intent_id,
          customer_mobile: args.customer_mobile,
          participant_count: 1,
          class_id: args.class_id,
          source: "airwallex",
          unit_price: args.amount,
          total_price: args.amount,
          purchase_datetime: new Date().toISOString(),
          slot_index: i,
        }
      );

      const purchase = await ctx.runQuery(
        makeFunctionReference<"query">("purchaseQueries:getPurchaseForConfirmation"),
        { purchase_id }
      );

      if (!purchase) {
        throw new Error(`Purchase ${i + 1} not found after creation`);
      }

      tokens.push(purchase.token as string);
      purchase_ids.push(String(purchase_id));

      try {
        await ctx.runAction(
          makeFunctionReference<"action">("purchaseConfirmation:sendPurchaseConfirmation"),
          { purchase_id }
        );
      } catch (err) {
        console.error(`[payments] WhatsApp send failed for purchase ${i + 1} (non-fatal):`, err);
      }
    }

    return { tokens, purchase_ids };
  },
});
