import { NextRequest, NextResponse } from "next/server";

import { completePaidHold } from "@/lib/checkoutServer";

/**
 * Airwallex payment webhook. A succeeded payment for a Seat Hold seats its Order (or
 * refunds it if it arrived too late). completePaidHold asks Airwallex itself, so a forged
 * event can't seat anyone.
 */
export async function POST(req: NextRequest) {
  try {
    const event = JSON.parse(await req.text());
    console.log("[webhook] received event:", event.name, "id:", event.id);

    if (event.name === "payment_intent.succeeded") {
      const intent = event.data?.object;
      const holdId = (intent?.metadata as Record<string, string> | undefined)?.hold_id;
      if (intent && holdId) {
        const outcome = await completePaidHold(holdId, intent.id as string);
        console.log("[webhook] seat hold", holdId, "->", outcome.outcome);
      } else {
        console.warn("[webhook] payment intent has no seat hold, ignoring:", intent?.id);
      }
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[webhook] error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
