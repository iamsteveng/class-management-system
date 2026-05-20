import { makeFunctionReference } from "convex/server";
import { NextResponse } from "next/server";

import { createConvexHttpClient } from "@/lib/convexHttp";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const client = createConvexHttpClient();
    const classes = await client.query(
      makeFunctionReference<"query">("homepage:listClassesWithPaymentUrl"),
      {}
    );

    return NextResponse.json({ classes }, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to load classes." },
      { status: 500 }
    );
  }
}
