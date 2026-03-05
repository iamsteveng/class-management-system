"use node";

import { actionGeneric, makeFunctionReference } from "convex/server";
import { v } from "convex/values";

import {
  getTwilioCredentialsFromConvexEnv,
  sendWhatsApp,
} from "../lib/twilio";
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
    const termsLink = buildTermsUrl(baseUrl, purchase.token);
    const message = `Your purchase is confirmed! Please accept terms: ${termsLink}`;

    const sent = await sendWhatsApp({
      to: purchase.customer_mobile,
      message,
      credentials:
        getTwilioCredentialsFromConvexEnv({
          get: (name) => process.env[name],
        }) ?? undefined,
    });

    if (sent) {
      await ctx.runMutation(
        makeFunctionReference<"mutation">("purchaseQueries:updatePurchaseStatus"),
        {
          purchase_id: purchase._id,
          status: "confirmation_sent",
        }
      );
    }

    return { success: sent };
  },
});
