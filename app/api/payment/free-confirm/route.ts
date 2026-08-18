import { NextRequest, NextResponse } from "next/server";
import { fetchAction } from "convex/nextjs";
import { makeFunctionReference } from "convex/server";

const E164_REGEX = /^\+[1-9]\d{7,14}$/;
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function POST(req: NextRequest) {
  try {
    const { class_id, mobile, quantity, request_id } = await req.json();
    if (!class_id || !mobile) {
      return NextResponse.json({ error: "class_id and mobile are required" }, { status: 400 });
    }

    // Normalize mobile (strip spaces, hyphens, parentheses) then validate E.164 format.
    const normalizedMobile = String(mobile).replace(/[\s\-()]/g, "");
    if (!E164_REGEX.test(normalizedMobile)) {
      return NextResponse.json({ error: "A valid WhatsApp mobile number is required" }, { status: 400 });
    }

    if (typeof request_id !== "string" || !UUID_REGEX.test(request_id)) {
      return NextResponse.json({ error: "A valid request_id is required" }, { status: 400 });
    }

    const qty = Math.max(1, Math.min(15, Number(quantity) || 1));

    const result = (await fetchAction(
      makeFunctionReference<"action">("payments:createFreePurchase"),
      {
        class_id,
        customer_mobile: normalizedMobile,
        quantity: qty,
        request_id,
      }
    )) as unknown as { tokens: string[]; purchase_ids: string[] };

    return NextResponse.json({ tokens: result.tokens });
  } catch (err) {
    console.error("[payment/free-confirm] error:", err);
    const message = err instanceof Error ? err.message : "";
    if (message.includes("Too many free registrations")) {
      return NextResponse.json(
        { error: "Too many requests. Please try again later." },
        { status: 429 }
      );
    }
    return NextResponse.json({ error: "Failed to create purchase record" }, { status: 500 });
  }
}
