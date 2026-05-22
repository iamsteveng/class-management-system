"use server";

import { makeFunctionReference } from "convex/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { getServerAuthSession } from "@/lib/auth";
import { createConvexHttpClient } from "@/lib/convexHttp";

export async function cancelAndRefundAction(
  purchaseId: string
): Promise<{ ok: boolean; refund_id?: string; error?: string }> {
  const session = await getServerAuthSession();
  if (!session?.user?.username) {
    redirect("/admin/login?error=Please%20log%20in%20to%20continue.");
  }

  const client = createConvexHttpClient();
  try {
    const result = await client.action(
      makeFunctionReference<"action">("purchaseRefund:cancelAndRefund"),
      {
        purchase_id: purchaseId,
        admin_username: session.user.username,
      }
    );
    if (result.ok) {
      revalidatePath("/admin/purchases");
    }
    return result as { ok: boolean; refund_id?: string; error?: string };
  } catch (err) {
    console.error("[cancelAndRefundAction] error:", err);
    return { ok: false, error: "An unexpected error occurred. Please try again." };
  }
}
