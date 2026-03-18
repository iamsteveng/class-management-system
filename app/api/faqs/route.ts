import { makeFunctionReference } from "convex/server";
import { NextResponse } from "next/server";

import { createConvexHttpClient } from "@/lib/convexHttp";

export async function GET() {
  try {
    const client = createConvexHttpClient();
    const faqs = await client.query(
      makeFunctionReference<"query">("faqs:listFaqs"),
      {}
    );

    return NextResponse.json({ faqs });
  } catch {
    return NextResponse.json(
      { error: "Failed to load FAQs." },
      { status: 500 }
    );
  }
}
