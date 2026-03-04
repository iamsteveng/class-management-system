"use node";

import { actionGeneric, mutationGeneric, queryGeneric, makeFunctionReference } from "convex/server";
import { v } from "convex/values";

import {
  getTwilioCredentialsFromConvexEnv,
  sendWhatsApp,
} from "../lib/twilio";

const DEFAULT_BASE_URL = "https://example.com";

export const getPurchaseForConfirmation = queryGeneric({
  args: {
    purchase_id: v.id("purchases"),
  },
  returns: v.union(
    v.null(),
    v.object({
      _id: v.id("purchases"),
      customer_mobile: v.string(),
      token: v.string(),
      status: v.union(
        v.literal("pending_terms"),
        v.literal("confirmation_sent"),
        v.literal("terms_accepted"),
        v.literal("cancelled")
      ),
    })
  ),
  handler: async (ctx, args) => {
    const purchase = await ctx.db.get(args.purchase_id);
    if (!purchase) {
      return null;
    }

    return {
      _id: purchase._id,
      customer_mobile: purchase.customer_mobile,
      token: purchase.token,
      status: purchase.status,
    };
  },
});

export const updatePurchaseStatus = mutationGeneric({
  args: {
    purchase_id: v.id("purchases"),
    status: v.union(
      v.literal("pending_terms"),
      v.literal("confirmation_sent"),
      v.literal("terms_accepted"),
      v.literal("cancelled")
    ),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await ctx.db.patch(args.purchase_id, {
      status: args.status,
    });
    return null;
  },
});

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
        "purchaseConfirmation:getPurchaseForConfirmation"
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
        makeFunctionReference<"mutation">("purchaseConfirmation:updatePurchaseStatus"),
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
