import { NextRequest, NextResponse } from "next/server";
import { fetchAction, fetchQuery } from "convex/nextjs";
import { api } from "@/convex/_generated/api";

export async function POST(req: NextRequest) {
  try {
    const { intent_id, class_id, mobile } = await req.json();
    if (!intent_id || !class_id || !mobile) {
      return NextResponse.json({ error: "intent_id, class_id, and mobile are required" }, { status: 400 });
    }

    // Fetch class to get the real price/currency server-side
    const classes = await fetchQuery(api.homepage.listClassesWithPaymentUrl, {});
    const cls = classes.find((c) => c.class_id === class_id);
    const amount = cls?.airwallex_price ?? 0;
    const currency = cls?.airwallex_currency ?? "HKD";

    const result = await fetchAction(api.payments.createPurchaseFromAirwallex, {
      intent_id,
      class_id,
      customer_mobile: mobile,
      amount,
      currency,
    });

    return NextResponse.json({ token: result.token });
  } catch (err) {
    console.error("[payment/confirm] error:", err);
    return NextResponse.json({ error: "Failed to create purchase record" }, { status: 500 });
  }
}
