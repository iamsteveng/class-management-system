import { makeFunctionReference } from "convex/server";
import { NextResponse } from "next/server";

import { createConvexHttpClient } from "@/lib/convexHttp";

type RouteContext = {
  params: Promise<{
    classId: string;
  }>;
};

export async function GET(_: Request, context: RouteContext) {
  const { classId } = await context.params;

  if (!classId) {
    return NextResponse.json({ sessions: [] });
  }

  try {
    const client = createConvexHttpClient();
    const sessions = await client.query(
      makeFunctionReference<"query">("homepage:getAvailableSessionsByClass"),
      {
        class_id: classId,
      }
    );

    return NextResponse.json({ sessions });
  } catch {
    return NextResponse.json(
      { error: "Failed to load sessions." },
      { status: 500 }
    );
  }
}
