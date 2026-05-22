"use node";

import { actionGeneric, makeFunctionReference } from "convex/server";
import { v } from "convex/values";

const AIRWALLEX_BASE_URL =
  process.env.AIRWALLEX_ENV === "prod"
    ? "https://api.airwallex.com"
    : "https://api-demo.airwallex.com";

const AIRWALLEX_API_VERSION = "2025-06-16";

async function getAirwallexToken(): Promise<string> {
  const res = await fetch(`${AIRWALLEX_BASE_URL}/api/v1/authentication/login`, {
    method: "POST",
    headers: {
      "x-client-id": process.env.AIRWALLEX_CLIENT_ID!,
      "x-api-key": process.env.AIRWALLEX_API_KEY!,
      "x-api-version": AIRWALLEX_API_VERSION,
      "Content-Type": "application/json",
    },
  });
  if (!res.ok) throw new Error(`Airwallex auth failed: ${res.status}`);
  const data = await res.json() as { token: string };
  return data.token;
}

export const cancelAndRefund = actionGeneric({
  args: {
    purchase_id: v.id("purchases"),
    admin_username: v.string(),
  },
  returns: v.object({
    ok: v.boolean(),
    refund_id: v.optional(v.string()),
    error: v.optional(v.string()),
  }),
  handler: async (ctx, args) => {
    const purchase = await ctx.runQuery(
      makeFunctionReference<"query">("purchaseRefundDb:getPurchaseForRefund"),
      { purchase_id: args.purchase_id }
    );

    if (!purchase) return { ok: false, error: "Purchase not found." };
    if (purchase.source !== "airwallex")
      return { ok: false, error: "Only Airwallex purchases can be refunded via this flow." };
    if (!purchase.total_price || purchase.total_price <= 0)
      return { ok: false, error: "Purchase has no refundable amount." };
    if (!purchase.currency)
      return { ok: false, error: "Purchase has no currency recorded. Cannot refund." };
    if (purchase.refund_status === "refunded")
      return { ok: false, error: "This purchase has already been refunded." };
    if (purchase.status === "cancelled")
      return { ok: false, error: "This purchase is already cancelled." };

    let token: string;
    try {
      token = await getAirwallexToken();
    } catch (err) {
      console.error("[purchaseRefund] Airwallex auth error:", err);
      return { ok: false, error: "Failed to authenticate with Airwallex." };
    }

    const refundRes = await fetch(
      `${AIRWALLEX_BASE_URL}/api/v1/pa/payment_intents/${purchase.order_id}/refund`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "x-api-version": AIRWALLEX_API_VERSION,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          request_id: crypto.randomUUID(),
          amount: purchase.total_price,
          currency: purchase.currency,
          reason: "requested_by_customer",
        }),
      }
    );

    if (!refundRes.ok) {
      const errBody = await refundRes.text();
      console.error("[purchaseRefund] Airwallex refund error:", errBody);
      return {
        ok: false,
        error: `Airwallex refund failed (${refundRes.status}): ${errBody}`,
      };
    }

    const refundData = await refundRes.json() as { id: string };

    await ctx.runMutation(
      makeFunctionReference<"mutation">("purchaseRefundDb:applyCancellation"),
      {
        purchase_id: args.purchase_id,
        admin_username: args.admin_username,
        refund_id: refundData.id,
        amount: purchase.total_price,
        currency: purchase.currency,
      }
    );

    return { ok: true, refund_id: refundData.id };
  },
});
