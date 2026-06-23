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

export async function POST(req: NextRequest) {
  try {
    const { intent_id, is_mobile, return_url, os_type } = await req.json();
    if (!intent_id) {
      return NextResponse.json({ error: "intent_id is required" }, { status: 400 });
    }

    const token = await getAirwallexToken();

    const flow = is_mobile ? "mobile_web" : "qrcode";
    const alipayhkParams: Record<string, string> = { flow };
    if (is_mobile && os_type) alipayhkParams.os_type = os_type;
    const body: Record<string, unknown> = {
      request_id: crypto.randomUUID(),
      payment_method: {
        type: "alipayhk",
        alipayhk: alipayhkParams,
      },
    };
    if (return_url) {
      body.return_url = return_url;
    }

    const confirmRes = await fetch(
      `${AIRWALLEX_BASE_URL}/api/v1/pa/payment_intents/${intent_id}/confirm`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "x-api-version": AIRWALLEX_API_VERSION,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      }
    );

    if (!confirmRes.ok) {
      const err = await confirmRes.text();
      console.error("[alipay-hk/start] Airwallex error:", err);
      const extra = process.env.AIRWALLEX_ENV !== "prod" ? { airwallex_debug: err } : {};
      return NextResponse.json(
        { error: "Failed to initiate Alipay HK payment", ...extra },
        { status: 502 }
      );
    }

    const data = await confirmRes.json();
    const next_action = data.next_action;

    if (!next_action) {
      console.error("[alipay-hk/start] No next_action in Airwallex response:", JSON.stringify(data));
      return NextResponse.json(
        { error: "No next_action in Airwallex response" },
        { status: 502 }
      );
    }

    console.log("[alipay-hk/start] next_action:", JSON.stringify(next_action));

    if (is_mobile === true) {
      return NextResponse.json({ type: "redirect", url: next_action.url ?? next_action.redirect_url ?? "" });
    }

    return NextResponse.json({
      type: "qrcode",
      qrcode:
        next_action.qr_code?.url ??
        next_action.qrcode_url ??
        next_action.qrcode_image_url ??
        next_action.data ??
        next_action.url ??
        "",
    });
  } catch (err) {
    console.error("[alipay-hk/start] error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
