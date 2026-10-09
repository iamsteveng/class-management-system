import { NextRequest, NextResponse } from "next/server";
import { makeFunctionReference } from "convex/server";

import { createPaymentIntentForHold, getPaymentIntent } from "@/lib/airwallex";
import { createConvexHttpClient } from "@/lib/convexHttp";

type StartResult =
  | { kind: "held"; hold_id: string; amount: number; currency: string; expires_at: number; intent_id?: string }
  | { kind: "completed"; hold_id: string; order_id: string; participant_ids: string[] }
  | { kind: "error"; code: string; message: string; index?: number };

/**
 * Starts a booking: holds the Customer's seats (or books a free Class outright) and, for
 * a paid Class, prepares the Airwallex payment for exactly the held amount.
 */
export async function POST(req: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const { request_id, class_id, session_id, customer_mobile, participants, terms_accepted } = body;
  if (
    typeof request_id !== "string" ||
    typeof class_id !== "string" ||
    typeof session_id !== "string" ||
    typeof customer_mobile !== "string" ||
    !Array.isArray(participants)
  ) {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  try {
    const client = createConvexHttpClient();
    const result = (await client.mutation(makeFunctionReference<"mutation">("checkout:startCheckout"), {
      request_id,
      class_id,
      session_id,
      customer_mobile,
      participants,
      terms_accepted: terms_accepted === true,
    })) as StartResult;

    if (result.kind === "error") {
      return NextResponse.json(result, { status: result.code === "full" ? 409 : 400 });
    }
    if (result.kind === "completed") {
      return NextResponse.json({ kind: "completed", hold_id: result.hold_id });
    }

    // A retried checkout reuses its payment intent rather than starting a second one.
    const intent = result.intent_id
      ? await getPaymentIntent(result.intent_id)
      : await createPaymentIntentForHold(result.hold_id, result.amount, result.currency);
    if (!result.intent_id) {
      await client.mutation(makeFunctionReference<"mutation">("checkout:attachPaymentIntent"), {
          hold_id: result.hold_id,
        intent_id: intent.id,
      });
    }

    return NextResponse.json({
      kind: "held",
      hold_id: result.hold_id,
      intent_id: intent.id,
      client_secret: intent.client_secret,
      amount: result.amount,
      currency: result.currency,
      expires_at: result.expires_at,
    });
  } catch (err) {
    console.error("[checkout/start] error:", err);
    return NextResponse.json({ error: "Could not start the booking. Please try again." }, { status: 500 });
  }
}
