"use node";

import { actionGeneric, makeFunctionReference } from "convex/server";
import { v } from "convex/values";

import { sendTermsAcceptanceWhatsApp } from "../lib/manychat";
import { buildTermsUrl, resolveAppBaseUrl } from "../lib/appBaseUrl";

export const sendPurchaseConfirmation = actionGeneric({
  args: {
    purchase_id: v.id("purchases"),
  },
  returns: v.object({
    success: v.boolean(),
  }),
  handler: async (ctx, args) => {
    const purchase = await ctx.runQuery(
      makeFunctionReference<"query">(
        "purchaseQueries:getPurchaseForConfirmation"
      ),
      {
        purchase_id: args.purchase_id,
      }
    );

    if (!purchase) {
      return { success: false };
    }

    if (purchase.status === "confirmation_sent") {
      return { success: true };
    }

    const baseUrl = resolveAppBaseUrl(process.env.APP_BASE_URL);
    const termsUrl = buildTermsUrl(baseUrl, purchase.token);

    const sent = await sendTermsAcceptanceWhatsApp({
      to: purchase.customer_mobile,
      termsUrl,
    });

    if (sent) {
      await ctx.runMutation(
        makeFunctionReference<"mutation">("purchaseQueries:updatePurchaseStatus"),
        {
          purchase_id: purchase._id,
          status: "confirmation_sent",
        }
      );
    } else {
      console.error(
        `[purchaseConfirmation] WhatsApp failed for order_id=${purchase.order_id ?? purchase._id}`
      );
    }

    return { success: sent };
  },
});
