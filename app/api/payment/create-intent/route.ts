import { NextRequest, NextResponse } from "next/server";
import { fetchQuery } from "convex/nextjs";
import { api } from "@/convex/_generated/api";

const AIRWALLEX_BASE_URL =
  process.env.AIRWALLEX_ENV === "prod"
    ? "https://api.airwallex.com"
    : "https://api-demo.airwallex.com";

async function getAirwallexToken(): Promise<string> {
  const res = await fetch(`${AIRWALLEX_BASE_URL}/api/v1/authentication/login`, {
    method: "POST",
    headers: {
      "x-client-id": process.env.AIRWALLEX_CLIENT_ID!,
      "x-api-key": process.env.AIRWALLEX_API_KEY!,
      "Content-Type": "application/json",
    },
  });
  if (!res.ok) throw new Error(`Airwallex auth failed: ${res.status}`);
  const data = await res.json();
  return data.token as string;
}

export async function POST(req: NextRequest) {
  try {
    const { class_id, mobile } = await req.json();
    if (!class_id || !mobile) {
      return NextResponse.json({ error: "class_id and mobile are required" }, { status: 400 });
    }

    const classes = await fetchQuery(api.homepage.listClassesWithPaymentUrl, {});
    const cls = classes.find((c) => c.class_id === class_id);
    if (!cls || !cls.airwallex_price) {
      return NextResponse.json({ error: "Class not configured for Airwallex payment" }, { status: 404 });
    }

    const token = await getAirwallexToken();
    const requestId = crypto.randomUUID();
    const currency = cls.airwallex_currency ?? "HKD";

    const intentRes = await fetch(`${AIRWALLEX_BASE_URL}/api/v1/pa/payment_intents/create`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        request_id: requestId,
        amount: cls.airwallex_price,
        currency,
        merchant_order_id: requestId,
        metadata: { class_id, mobile },
      }),
    });

    if (!intentRes.ok) {
      const err = await intentRes.text();
      console.error("[create-intent] Airwallex error:", err);
      return NextResponse.json({ error: "Failed to create payment intent" }, { status: 502 });
    }

    const intent = await intentRes.json();
    return NextResponse.json({
      intent_id: intent.id as string,
      client_secret: intent.client_secret as string,
      amount: cls.airwallex_price,
      currency,
    });
  } catch (err) {
    console.error("[create-intent] error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
