/**
 * Server-side Airwallex calls for the checkout routes. Credentials live only in the
 * Vercel environment, never in Convex.
 */

const AIRWALLEX_BASE_URL =
  process.env.AIRWALLEX_ENV === "prod" ? "https://api.airwallex.com" : "https://api-demo.airwallex.com";

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
  const data = (await res.json()) as { token: string };
  return data.token;
}

async function airwallex<T>(path: string, init: { method?: string; body?: unknown } = {}): Promise<T> {
  const token = await getAirwallexToken();
  const res = await fetch(`${AIRWALLEX_BASE_URL}${path}`, {
    method: init.method ?? "GET",
    headers: {
      Authorization: `Bearer ${token}`,
      "x-api-version": AIRWALLEX_API_VERSION,
      "Content-Type": "application/json",
    },
    body: init.body === undefined ? undefined : JSON.stringify(init.body),
  });
  if (!res.ok) {
    throw new Error(`Airwallex ${path} failed (${res.status}): ${await res.text()}`);
  }
  return (await res.json()) as T;
}

export type PaymentIntent = {
  id: string;
  client_secret?: string;
  amount: number;
  currency: string;
  status: string;
  merchant_order_id?: string;
  metadata?: Record<string, string>;
};

/** A payment intent for one Seat Hold, tagged with the hold so the webhook can find it. */
export function createPaymentIntentForHold(holdId: string, amount: number, currency: string) {
  return airwallex<PaymentIntent>("/api/v1/pa/payment_intents/create", {
    method: "POST",
    body: {
      request_id: crypto.randomUUID(),
      amount,
      currency,
      merchant_order_id: holdId,
      metadata: { hold_id: holdId },
    },
  });
}

export function getPaymentIntent(intentId: string) {
  return airwallex<PaymentIntent>(`/api/v1/pa/payment_intents/${encodeURIComponent(intentId)}`);
}

export function refundPaymentIntent(intentId: string, amount: number, currency: string) {
  return airwallex<{ id: string }>("/api/v1/pa/refunds/create", {
    method: "POST",
    body: {
      request_id: crypto.randomUUID(),
      payment_intent_id: intentId,
      amount,
      currency,
      reason: "Session became full before payment completed",
    },
  });
}
