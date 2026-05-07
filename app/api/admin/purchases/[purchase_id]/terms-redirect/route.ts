import { makeFunctionReference } from "convex/server";
import { redirect } from "next/navigation";
import { NextRequest } from "next/server";

import { getServerAuthSession } from "@/lib/auth";
import { createConvexHttpClient } from "@/lib/convexHttp";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ purchase_id: string }> }
) {
  const session = await getServerAuthSession();
  if (!session?.user?.username) {
    redirect("/admin/login?error=Please%20log%20in%20to%20continue.");
  }

  const { purchase_id } = await params;

  const client = createConvexHttpClient();
  const purchase = await client.query(
    makeFunctionReference<"query">("purchaseQueries:getPurchaseForConfirmation"),
    { purchase_id: purchase_id as never }
  );

  if (!purchase?.token) {
    redirect("/admin/purchases");
  }

  redirect(`/terms?token=${purchase.token}`);
}
