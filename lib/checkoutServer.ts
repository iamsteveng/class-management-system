import { makeFunctionReference } from "convex/server";

import { getPaymentIntent, refundPaymentIntent } from "./airwallex";
import { createConvexHttpClient } from "./convexHttp";

/**
 * Server-only glue between Airwallex and the Convex checkout: never trusts the browser
 * about a payment, always asks Airwallex.
 */

export type CompleteOutcome =
  | { outcome: "seated"; order_id: string; participant_ids: string[] }
  | { outcome: "refunded"; status: string }
  | { outcome: "not_paid"; status: string };

/**
 * Seats the Order for a Seat Hold once Airwallex confirms its payment succeeded. If the
 * payment arrived too late for the Session, refunds it in full and records the refund.
 * Safe to call from both the browser's confirm step and the webhook.
 */
export async function completePaidHold(holdId: string, intentId: string): Promise<CompleteOutcome> {
  const intent = await getPaymentIntent(intentId);
  if (intent.metadata?.hold_id !== holdId) {
    throw new Error("Payment does not belong to this booking.");
  }
  if (intent.status !== "SUCCEEDED") {
    return { outcome: "not_paid", status: intent.status };
  }

  const client = createConvexHttpClient();
  const result = (await client.mutation(makeFunctionReference<"mutation">("checkout:completeCheckout"), {
    hold_id: holdId,
    intent_id: intent.id,
    amount: intent.amount,
    currency: intent.currency,
  })) as
    | { outcome: "seated"; order_id: string; participant_ids: string[] }
    | { outcome: "refund_needed"; intent_id: string; amount: number; currency: string }
    | { outcome: "refunded"; status: string };

  if (result.outcome !== "refund_needed") return result;

  let refundId: string | undefined;
  let error: string | undefined;
  try {
    refundId = (await refundPaymentIntent(result.intent_id, result.amount, result.currency)).id;
  } catch (err) {
    error = err instanceof Error ? err.message : String(err);
    console.error("[checkout] late-payment refund failed:", err);
  }
  await client.mutation(makeFunctionReference<"mutation">("checkout:recordCheckoutRefund"), {
    hold_id: holdId,
    refund_id: refundId,
    error,
  });
  return { outcome: "refunded", status: refundId ? "refunded" : "refund_failed" };
}
