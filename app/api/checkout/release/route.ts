import { NextRequest, NextResponse } from "next/server";
import { makeFunctionReference } from "convex/server";

import { createConvexHttpClient } from "@/lib/convexHttp";

/** The Customer backed out before paying: give their held seats back straight away. */
export async function POST(req: NextRequest) {
  try {
    const { hold_id } = (await req.json()) as { hold_id?: unknown };
    if (typeof hold_id !== "string") {
      return NextResponse.json({ error: "Invalid request." }, { status: 400 });
    }
    await createConvexHttpClient().mutation(makeFunctionReference<"mutation">("checkout:releaseSeatHold"), {
      hold_id,
    });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[checkout/release] error:", err);
    return NextResponse.json({ error: "Could not release the seats." }, { status: 500 });
  }
}
