import { NextRequest, NextResponse } from "next/server";
import { fetchAction } from "convex/nextjs";
import { api } from "@/convex/_generated/api";

export async function POST(req: NextRequest) {
  try {
    const body = await req.text();
    const event = JSON.parse(body);

    console.log("[webhook] received event:", event.name, "id:", event.id);

    if (event.name === "payment_intent.succeeded") {
      const intent = event.data?.object;
      if (intent) {
        const metadata = (intent.metadata ?? {}) as Record<string, string>;
        const class_id = metadata.class_id;
        const mobile = metadata.mobile;

        if (class_id && mobile) {
          await fetchAction(api.payments.createPurchaseFromAirwallex, {
            intent_id: intent.id as string,
            class_id,
            customer_mobile: mobile,
            amount: (intent.amount as number) ?? 0,
            currency: (intent.currency as string) ?? "HKD",
          });
        } else {
          console.warn("[webhook] Missing class_id or mobile in intent metadata, skipping purchase creation");
        }
      }
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[webhook] error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
