import { NextRequest, NextResponse } from "next/server";

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
  const data = await res.json();
  return data.token as string;
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const intent_id = searchParams.get("intent_id");

    if (!intent_id) {
      return NextResponse.json({ error: "intent_id is required" }, { status: 400 });
    }

    const token = await getAirwallexToken();

    const intentRes = await fetch(
      `${AIRWALLEX_BASE_URL}/api/v1/pa/payment_intents/${intent_id}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "x-api-version": AIRWALLEX_API_VERSION,
        },
      }
    );

    if (!intentRes.ok) {
      const err = await intentRes.text();
      console.error("[alipay-hk/status] Airwallex error:", err);
      return NextResponse.json({ succeeded: false });
    }

    const data = await intentRes.json();
    return NextResponse.json({ succeeded: data.status === "SUCCEEDED" });
  } catch (err) {
    console.error("[alipay-hk/status] error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
