import { makeFunctionReference } from "convex/server";
import { NextResponse } from "next/server";

import { createConvexHttpClient } from "@/lib/convexHttp";

export async function GET() {
  try {
    const client = createConvexHttpClient();
    const classes = await client.query(
      makeFunctionReference<"query">("homepage:getAvailableClasses"),
      {}
    );

    return NextResponse.json({ classes });
  } catch {
    return NextResponse.json(
      { error: "Failed to load classes." },
      { status: 500 }
    );
  }
}
