// ManyChat WhatsApp integration (US-025 simplified)
//
// sendTermsAcceptanceWhatsApp flow:
//   1. If subscriberId provided (from DB cache) — use it directly
//   2. If not found — call createSubscriber to get a new ID
//      - On 400 "already exists" without stored ID: log error and return false
//   3. setCustomFields (field_id 14438749 = termsUrl)
//   4. sendFlow with TERMS_FLOW_NS
//
// Returns { success, subscriberId } so the caller can persist the ID to the
// manychat_subscribers lookup table and purchases.manychat_subscriber_id.

const MANYCHAT_API_BASE = "https://api.manychat.com";
const TERMS_URL_FIELD = "cuf_14438749";
// Flow NS for terms acceptance; can be overridden via MANYCHAT_TERMS_FLOW_NS env var
const TERMS_FLOW_NS =
  process.env.MANYCHAT_TERMS_FLOW_NS ?? "content20260331095255_664930";

type SendTermsWhatsAppParams = {
  to: string; // E.164 phone number, e.g. +85254304789
  termsUrl: string;
  subscriberId?: string | null; // pre-resolved from DB; if set, skips createSubscriber
};

export type SendTermsResult = {
  success: boolean;
  subscriberId: string | null;
};

/** Remove leading + from a phone string (if present). */
function stripPlus(phone: string): string {
  return phone.startsWith("+") ? phone.slice(1) : phone;
}

export async function sendTermsAcceptanceWhatsApp({
  to,
  termsUrl,
  subscriberId: existingSubscriberId,
}: SendTermsWhatsAppParams): Promise<SendTermsResult> {
  const apiKey = process.env.MANYCHAT_API_KEY;
  if (!apiKey) {
    console.error(
      "[manychat] MANYCHAT_API_KEY is not set — cannot send WhatsApp message"
    );
    return { success: false, subscriberId: null };
  }

  const headers = {
    Authorization: `Bearer ${apiKey}`,
    "Content-Type": "application/json",
  };

  // ── Step 1: Resolve subscriber ID ────────────────────────────────────────

  let subscriberId: string | null = existingSubscriberId ?? null;

  if (!subscriberId) {
    console.log(
      `[manychat] No stored subscriber ID for ${to} — calling createSubscriber`
    );
    try {
      const createRes = await fetch(
        `${MANYCHAT_API_BASE}/fb/subscriber/createSubscriber`,
        {
          method: "POST",
          headers,
          body: JSON.stringify({
            whatsapp_phone: to,
            phone: stripPlus(to),
            has_opt_in_whatsapp: true,
            has_opt_in_sms: false,
            has_opt_in_email: false,
            consent_phrase: "User agreed to receive WhatsApp messages",
          }),
        }
      );
      const createData = await createRes.json();
      console.log(
        `[manychat] createSubscriber HTTP ${createRes.status} for ${to}: ${JSON.stringify(createData)}`
      );

      if (createRes.ok && createData?.data?.id) {
        subscriberId = String(createData.data.id);
        console.log(
          `[manychat] Created new subscriber_id=${subscriberId} for ${to}`
        );
      } else if (
        createRes.status === 400 &&
        typeof createData?.message === "string" &&
        createData.message.toLowerCase().includes("already exists")
      ) {
        // Subscriber already exists in ManyChat but no stored ID — cannot resolve
        console.error(
          `[manychat] createSubscriber 400 "already exists" for ${to} and no stored subscriber ID — cannot send WhatsApp`
        );
        return { success: false, subscriberId: null };
      } else {
        console.error(
          `[manychat] createSubscriber failed for ${to} — status=${createRes.status}`
        );
        return { success: false, subscriberId: null };
      }
    } catch (err) {
      console.error(
        `[manychat] Error during createSubscriber for ${to}:`,
        err
      );
      return { success: false, subscriberId: null };
    }
  } else {
    console.log(
      `[manychat] Using stored subscriber_id=${subscriberId} for ${to}`
    );
  }

  // ── Step 2: Set custom field (terms URL) via setCustomFields ──────────────
  try {
    const setFieldRes = await fetch(
      `${MANYCHAT_API_BASE}/fb/subscriber/setCustomFields`,
      {
        method: "POST",
        headers,
        body: JSON.stringify({
          subscriber_id: Number(subscriberId),
          fields: [
            {
              field_id: Number(TERMS_URL_FIELD.replace("cuf_", "")),
              field_value: termsUrl,
            },
          ],
        }),
      }
    );
    const setFieldBody = await setFieldRes.text();
    console.log(
      `[manychat] setCustomFields response: status=${setFieldRes.status} body=${setFieldBody}`
    );
    if (!setFieldRes.ok) {
      console.error(
        `[manychat] setCustomFields HTTP ${setFieldRes.status} for subscriber ${subscriberId}: ${setFieldBody}`
      );
      return { success: false, subscriberId: null };
    }
  } catch (err) {
    console.error(
      `[manychat] Error setting custom field for subscriber ${subscriberId}:`,
      err
    );
    return { success: false, subscriberId: null };
  }

  // ── Step 3: Send via sendFlow ─────────────────────────────────────────────
  try {
    const flowNs = TERMS_FLOW_NS;
    const sendRes = await fetch(`${MANYCHAT_API_BASE}/fb/sending/sendFlow`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        subscriber_id: subscriberId,
        flow_ns: flowNs,
      }),
    });

    const responseBody = await sendRes.text();
    console.log(
      `[manychat] sendFlow response: status=${sendRes.status} body=${responseBody}`
    );
    if (!sendRes.ok) {
      console.error(
        `[manychat] sendFlow HTTP ${sendRes.status} for subscriber ${subscriberId}: ${responseBody}`
      );
      return { success: false, subscriberId: null };
    }

    return { success: true, subscriberId };
  } catch (err) {
    console.error(
      `[manychat] Error sending flow to subscriber ${subscriberId}:`,
      err
    );
    return { success: false, subscriberId: null };
  }
}

// ── Rain Cancellation WhatsApp ────────────────────────────────────────────────
//
// sendRainCancellationWhatsApp flow:
//   1. Resolve subscriber ID (cache or createSubscriber)
//   2. setCustomFields with participant pass URL (field MANYCHAT_RAIN_CANCEL_PASS_URL_FIELD)
//   3. sendFlow with MANYCHAT_RAIN_CANCEL_FLOW_NS
//
// Set env vars MANYCHAT_RAIN_CANCEL_PASS_URL_FIELD and MANYCHAT_RAIN_CANCEL_FLOW_NS
// after creating the ManyChat template.

const RAIN_CANCEL_PASS_URL_FIELD =
  process.env.MANYCHAT_RAIN_CANCEL_PASS_URL_FIELD ?? "";
const RAIN_CANCEL_FLOW_NS =
  process.env.MANYCHAT_RAIN_CANCEL_FLOW_NS ?? "";

type SendRainCancellationParams = {
  to: string; // E.164 phone number
  participantPassUrl: string;
  subscriberId?: string | null;
};

export async function sendRainCancellationWhatsApp({
  to,
  participantPassUrl,
  subscriberId: existingSubscriberId,
}: SendRainCancellationParams): Promise<SendTermsResult> {
  const apiKey = process.env.MANYCHAT_API_KEY;
  if (!apiKey) {
    console.error("[manychat] MANYCHAT_API_KEY is not set — cannot send rain cancellation WhatsApp");
    return { success: false, subscriberId: null };
  }

  if (!RAIN_CANCEL_FLOW_NS) {
    console.error("[manychat] MANYCHAT_RAIN_CANCEL_FLOW_NS is not set — cannot send rain cancellation WhatsApp");
    return { success: false, subscriberId: null };
  }

  const headers = {
    Authorization: `Bearer ${apiKey}`,
    "Content-Type": "application/json",
  };

  // ── Step 1: Resolve subscriber ID ────────────────────────────────────────
  let subscriberId: string | null = existingSubscriberId ?? null;

  if (!subscriberId) {
    console.log(`[manychat] No stored subscriber ID for ${to} — calling createSubscriber`);
    try {
      const createRes = await fetch(`${MANYCHAT_API_BASE}/fb/subscriber/createSubscriber`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          whatsapp_phone: to,
          phone: stripPlus(to),
          has_opt_in_whatsapp: true,
          has_opt_in_sms: false,
          has_opt_in_email: false,
          consent_phrase: "User agreed to receive WhatsApp messages",
        }),
      });
      const createData = await createRes.json();
      console.log(`[manychat] createSubscriber HTTP ${createRes.status} for ${to}: ${JSON.stringify(createData)}`);

      if (createRes.ok && createData?.data?.id) {
        subscriberId = String(createData.data.id);
      } else if (
        createRes.status === 400 &&
        typeof createData?.message === "string" &&
        createData.message.toLowerCase().includes("already exists")
      ) {
        console.error(`[manychat] createSubscriber 400 "already exists" for ${to} — no stored ID, cannot send`);
        return { success: false, subscriberId: null };
      } else {
        console.error(`[manychat] createSubscriber failed for ${to} — status=${createRes.status}`);
        return { success: false, subscriberId: null };
      }
    } catch (err) {
      console.error(`[manychat] Error during createSubscriber for ${to}:`, err);
      return { success: false, subscriberId: null };
    }
  }

  // ── Step 2: Set custom field (participant pass URL) ───────────────────────
  if (RAIN_CANCEL_PASS_URL_FIELD) {
    try {
      const fieldId = Number(RAIN_CANCEL_PASS_URL_FIELD.replace("cuf_", ""));
      const setFieldRes = await fetch(`${MANYCHAT_API_BASE}/fb/subscriber/setCustomFields`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          subscriber_id: Number(subscriberId),
          fields: [{ field_id: fieldId, field_value: participantPassUrl }],
        }),
      });
      const setFieldBody = await setFieldRes.text();
      console.log(`[manychat] setCustomFields (rain cancel) status=${setFieldRes.status} body=${setFieldBody}`);
      if (!setFieldRes.ok) {
        console.error(`[manychat] setCustomFields failed for subscriber ${subscriberId}: ${setFieldBody}`);
        // Preserve subscriberId so caller can still cache it for future sends
        return { success: false, subscriberId };
      }
    } catch (err) {
      console.error(`[manychat] Error setting custom field for subscriber ${subscriberId}:`, err);
      return { success: false, subscriberId };
    }
  } else {
    console.warn(`[manychat] MANYCHAT_RAIN_CANCEL_PASS_URL_FIELD not set — skipping setCustomFields`);
  }

  // ── Step 3: Send via sendFlow ─────────────────────────────────────────────
  try {
    const sendRes = await fetch(`${MANYCHAT_API_BASE}/fb/sending/sendFlow`, {
      method: "POST",
      headers,
      body: JSON.stringify({ subscriber_id: subscriberId, flow_ns: RAIN_CANCEL_FLOW_NS }),
    });
    const responseBody = await sendRes.text();
    console.log(`[manychat] sendFlow (rain cancel) status=${sendRes.status} body=${responseBody}`);
    if (!sendRes.ok) {
      console.error(`[manychat] sendFlow (rain cancel) failed for subscriber ${subscriberId}: ${responseBody}`);
      return { success: false, subscriberId: null };
    }
    return { success: true, subscriberId };
  } catch (err) {
    console.error(`[manychat] Error sending rain cancel flow to subscriber ${subscriberId}:`, err);
    return { success: false, subscriberId: null };
  }
}
