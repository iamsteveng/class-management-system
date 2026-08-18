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
          currency: args.currency,
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

export const createFreePurchase = actionGeneric({
  args: {
    class_id: v.string(),
    customer_mobile: v.string(),
    quantity: v.optional(v.number()),
    request_id: v.string(),
  },
  returns: v.object({ tokens: v.array(v.string()), purchase_ids: v.array(v.string()) }),
  handler: async (ctx, args) => {
    // SECURITY: never trust the client — verify server-side that the class is genuinely free.
    const classes = await ctx.runQuery(
      makeFunctionReference<"query">("homepage:listClassesWithPaymentUrl"),
      {}
    );
    const cls = classes.find((c: { class_id: string; is_free?: boolean }) => c.class_id === args.class_id);
    if (!cls || cls.is_free !== true) {
      throw new Error("This class is not free of charge.");
    }

    const qty = Math.max(1, Math.min(15, args.quantity ?? 1));

    // Abuse mitigation: cap free registrations per mobile number per class within
    // a rolling 60-minute window. Counting happens here (where inserts happen),
    // not only in the Next.js route, so it can't be bypassed by calling the
    // action directly.
    const recentCount = await ctx.runQuery(
      makeFunctionReference<"query">("purchaseQueries:countRecentFreePurchasesForMobile"),
      { customer_mobile: args.customer_mobile, class_id: args.class_id }
    );
    if (recentCount + qty > 30) {
      throw new Error("Too many free registrations for this number. Please try again later.");
    }

    // Use a stable order_id derived from the client-supplied request_id so retries
    // after a mid-batch failure hit createPurchase's existing order_id+class_id+slot_index
    // dedupe path instead of creating duplicate purchases and double-sending WhatsApp.
    const orderId = `free_${args.request_id}`;
    const tokens: string[] = [];
    const purchase_ids: string[] = [];

    for (let i = 0; i < qty; i++) {
      const purchase_id = await ctx.runMutation(
        makeFunctionReference<"mutation">("purchases:createPurchase"),
        {
          order_id: orderId,
          customer_mobile: args.customer_mobile,
          participant_count: 1,
          class_id: args.class_id,
          source: "free",
          unit_price: 0,
          total_price: 0,
          currency: "HKD",
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
        console.error(`[payments] WhatsApp send failed for free purchase ${i + 1} (non-fatal):`, err);
      }
    }

    return { tokens, purchase_ids };
  },
});
