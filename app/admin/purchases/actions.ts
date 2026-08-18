"use server";

import { makeFunctionReference } from "convex/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { getServerAuthSession } from "@/lib/auth";
import { createConvexHttpClient } from "@/lib/convexHttp";

const AIRWALLEX_BASE_URL =
  process.env.AIRWALLEX_ENV === "prod"
    ? "https://api.airwallex.com"
    : "https://api-demo.airwallex.com";

const AIRWALLEX_API_VERSION = "2025-06-16";

async function getAirwallexToken(): Promise<string> {
  const res = await fetch(`${AIRWALLEX_BASE_URL}/api/v1/authentication/login`, {
    method: "POST",
    headers: {
      "x-client-id": process.env.AIRWALLEX_CLIENT_ID!,
      "x-api-key": process.env.AIRWALLEX_API_KEY!,
      "x-api-version": AIRWALLEX_API_VERSION,
      "Content-Type": "application/json",
    },
  });
  if (!res.ok) throw new Error(`Airwallex auth failed: ${res.status}`);
  const data = await res.json() as { token: string };
  return data.token;
}

export async function cancelAndRefundAction(
  purchaseId: string
): Promise<{ ok: boolean; refund_id?: string; error?: string }> {
  const session = await getServerAuthSession();
  if (!session?.user?.username) {
    redirect("/admin/login?error=Please%20log%20in%20to%20continue.");
  }

  const client = createConvexHttpClient();

  // 1. Load and validate purchase via Convex query
  let purchase: {
    _id: string;
    order_id: string;
    source?: "s3" | "payment_gateway" | "airwallex" | "free";
    total_price?: number;
    currency?: string;
    status: string;
    refund_status?: string;
  } | null;

  try {
    purchase = await client.query(
      makeFunctionReference<"query">("purchaseRefundDb:getPurchaseForRefund"),
      { purchase_id: purchaseId }
    ) as typeof purchase;
  } catch (err) {
    console.error("[cancelAndRefundAction] query error:", err);
    return { ok: false, error: "Failed to load purchase. Please try again." };
  }

  if (!purchase) return { ok: false, error: "Purchase not found." };
  if (purchase.source !== "airwallex")
    return { ok: false, error: "Only Airwallex purchases can be refunded via this flow." };
  if (!purchase.total_price || purchase.total_price <= 0)
    return { ok: false, error: "Purchase has no refundable amount." };
  if (!purchase.currency)
    return { ok: false, error: "Purchase has no currency recorded. Cannot refund." };
  if (purchase.refund_status === "refunded")
    return { ok: false, error: "This purchase has already been refunded." };
  if (purchase.status === "cancelled")
    return { ok: false, error: "This purchase is already cancelled." };

  // 2. Authenticate with Airwallex (credentials from Vercel env — never stored in Convex)
  let token: string;
  try {
    token = await getAirwallexToken();
  } catch (err) {
    console.error("[cancelAndRefundAction] Airwallex auth error:", err);
    return { ok: false, error: "Failed to authenticate with Airwallex." };
  }

  // 3. Call Airwallex refund endpoint
  const refundRes = await fetch(
    `${AIRWALLEX_BASE_URL}/api/v1/pa/refunds/create`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "x-api-version": AIRWALLEX_API_VERSION,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        request_id: crypto.randomUUID(),
        payment_intent_id: purchase.order_id,
        amount: purchase.total_price,
        currency: purchase.currency,
        reason: "requested_by_customer",
      }),
    }
  );

  if (!refundRes.ok) {
    const errText = await refundRes.text();
    console.error("[cancelAndRefundAction] Airwallex refund error:", errText);
    let errMessage = errText;
    try {
      const errJson = JSON.parse(errText) as { message?: string; code?: string };
      errMessage = errJson.message ?? errText;
      // Airwallex blocks a second refund while one is still pending on the same intent
      if (
        refundRes.status === 400 &&
        (errJson.code?.toLowerCase().includes("refund") ||
          errMessage.toLowerCase().includes("refund") ||
          errMessage.toLowerCase().includes("pending"))
      ) {
        errMessage +=
          " — A previous refund on this payment may still be processing. Wait a minute and try again.";
      }
    } catch {
      // errText is not JSON — use as-is
    }
    return {
      ok: false,
      error: `Airwallex refund failed (${refundRes.status}): ${errMessage}`,
    };
  }

  const refundData = await refundRes.json() as { id: string };

  // 4. Update DB only after confirmed Airwallex success
  try {
    await client.mutation(
      makeFunctionReference<"mutation">("purchaseRefundDb:applyCancellation"),
      {
        purchase_id: purchaseId,
        admin_username: session.user.username,
        refund_id: refundData.id,
        amount: purchase.total_price,
        currency: purchase.currency,
      }
    );
  } catch (err) {
    console.error("[cancelAndRefundAction] DB mutation error:", err);
    return {
      ok: false,
      error: `Refund processed by Airwallex (refund_id: ${refundData.id}) but failed to update the database. Contact support.`,
    };
  }

  revalidatePath("/admin/purchases");
  return { ok: true, refund_id: refundData.id };
}
