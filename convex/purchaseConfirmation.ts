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

    // Look up any stored ManyChat subscriber ID for this phone number
    const storedSubscriberId = await ctx.runQuery(
      makeFunctionReference<"query">("manychatSubscribers:getByPhone"),
      { whatsapp_phone: purchase.customer_mobile }
    );

    const baseUrl = resolveAppBaseUrl(process.env.APP_BASE_URL);
    const termsUrl = buildTermsUrl(baseUrl, purchase.token);

    console.log(
      `[purchaseConfirmation] Sending WhatsApp to=${purchase.customer_mobile} termsUrl=${termsUrl} purchase_id=${purchase._id} storedSubscriberId=${storedSubscriberId ?? "none"}`
    );
    const result = await sendTermsAcceptanceWhatsApp({
      to: purchase.customer_mobile,
      termsUrl,
      subscriberId: storedSubscriberId,
    });
    console.log(
      `[purchaseConfirmation] WhatsApp send result: success=${result.success} subscriberId=${result.subscriberId ?? "null"} to=${purchase.customer_mobile}`
    );

    if (result.success && result.subscriberId) {
      // Persist subscriber ID for future lookups (avoids createSubscriber on repeat sends)
      await ctx.runMutation(
        makeFunctionReference<"mutation">("manychatSubscribers:upsertSubscriber"),
        {
          whatsapp_phone: purchase.customer_mobile,
          subscriber_id: result.subscriberId,
        }
      );
      // Store on purchase record for auditing
      await ctx.runMutation(
        makeFunctionReference<"mutation">("purchases:updateManychatSubscriberId"),
        {
          purchase_id: purchase._id,
          manychat_subscriber_id: result.subscriberId,
        }
      );
      await ctx.runMutation(
        makeFunctionReference<"mutation">("purchaseQueries:updatePurchaseStatus"),
        {
          purchase_id: purchase._id,
          status: "confirmation_sent",
        }
      );
    } else if (result.success) {
      // Sent successfully but no subscriberId returned — still mark as sent
      await ctx.runMutation(
        makeFunctionReference<"mutation">("purchaseQueries:updatePurchaseStatus"),
        {
          purchase_id: purchase._id,
          status: "confirmation_sent",
        }
      );
    } else {
      console.error(
        `[purchaseConfirmation] WhatsApp failed for purchase_id=${purchase._id}`
      );
    }

    return { success: result.success };
  },
});
