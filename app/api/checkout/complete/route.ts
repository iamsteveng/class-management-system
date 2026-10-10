import { NextRequest, NextResponse } from "next/server";

import { completePaidHold } from "@/lib/checkoutServer";

/** Called by the browser once Airwallex says the payment went through; the server checks for itself. */
export async function POST(req: NextRequest) {
  try {
    const { hold_id, intent_id } = (await req.json()) as { hold_id?: unknown; intent_id?: unknown };
    if (typeof hold_id !== "string" || typeof intent_id !== "string") {
      return NextResponse.json({ error: "Invalid request." }, { status: 400 });
    }
    return NextResponse.json(await completePaidHold(hold_id, intent_id));
  } catch (err) {
    console.error("[checkout/complete] error:", err);
    return NextResponse.json({ error: "Could not confirm the booking." }, { status: 500 });
  }
}
