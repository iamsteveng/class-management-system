"use node";

import { actionGeneric, makeFunctionReference } from "convex/server";
import { v } from "convex/values";

import { sendTermsAcceptanceWhatsApp } from "../lib/manychat";
import { buildTermsUrl, resolveAppBaseUrl } from "../lib/appBaseUrl";
import { normalizeToE164 } from "../lib/phone";

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

    // Atomically claim the right to send — only the first concurrent caller wins.
    // This prevents duplicate WhatsApp messages when both /confirm and the webhook
    // fire for the same payment_intent simultaneously.
    const claimed = await ctx.runMutation(
      makeFunctionReference<"mutation">("purchaseQueries:claimConfirmationSend"),
      { purchase_id: args.purchase_id }
    );
    if (!claimed) {
      return { success: true };
    }

    // Normalize to E.164 for consistent subscriber cache lookup and ManyChat API
    const normalizedMobile = normalizeToE164(purchase.customer_mobile) ?? purchase.customer_mobile;

    // Look up any stored ManyChat subscriber ID for this phone number
    const storedSubscriberId = await ctx.runQuery(
      makeFunctionReference<"query">("manychatSubscribers:getByPhone"),
      { whatsapp_phone: normalizedMobile }
    );

    const baseUrl = resolveAppBaseUrl(process.env.APP_BASE_URL);
    const termsUrl = buildTermsUrl(baseUrl, purchase.token);

    console.log(
      `[purchaseConfirmation] Sending WhatsApp to=${normalizedMobile} termsUrl=${termsUrl} purchase_id=${purchase._id} storedSubscriberId=${storedSubscriberId ?? "none"}`
    );
    const result = await sendTermsAcceptanceWhatsApp({
      to: normalizedMobile,
      termsUrl,
      subscriberId: storedSubscriberId,
    });
    console.log(
      `[purchaseConfirmation] WhatsApp send result: success=${result.success} subscriberId=${result.subscriberId ?? "null"} to=${normalizedMobile}`
    );

    if (result.success && result.subscriberId) {
      // Persist subscriber ID for future lookups (avoids createSubscriber on repeat sends)
      await ctx.runMutation(
        makeFunctionReference<"mutation">("manychatSubscribers:upsertSubscriber"),
        {
          whatsapp_phone: normalizedMobile,
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
    } else if (!result.success) {
      console.error(
        `[purchaseConfirmation] WhatsApp failed for purchase_id=${purchase._id}`
      );
    }

    return { success: result.success };
  },
});
