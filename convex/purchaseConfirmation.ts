"use node";

import { actionGeneric, makeFunctionReference } from "convex/server";
import { v } from "convex/values";

import {
  getTwilioCredentialsFromConvexEnv,
  sendWhatsApp,
} from "../lib/twilio";

const DEFAULT_BASE_URL = "https://example.com";

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

    const baseUrl = resolveBaseUrl(process.env.APP_BASE_URL);
    const termsLink = `${baseUrl}/terms?token=${encodeURIComponent(purchase.token)}`;
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

function resolveBaseUrl(baseUrlFromEnv: string | undefined): string {
  const raw = baseUrlFromEnv?.trim();
  if (!raw) {
    return DEFAULT_BASE_URL;
  }

  if (raw.startsWith("http://") || raw.startsWith("https://")) {
    return raw.replace(/\/+$/, "");
  }

  return `https://${raw.replace(/\/+$/, "")}`;
}
