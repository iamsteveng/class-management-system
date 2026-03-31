// ManyChat WhatsApp integration
// sendTermsAcceptanceWhatsApp resolves subscriber ID by phone and sends
// terms acceptance message via sendFlow (US-021).
//
// Lookup chain (US-020):
//   1. findBySystemField(phone, E.164 with +) — phone field reliably set at creation
//   2. createSubscriber(phone + whatsapp_phone) — if 400 "WhatsApp ID already exists":
//      2a. findBySystemField(wa_id, extracted wa_id)
//      2b. findBySystemField(whatsapp_phone, digits only, no +) [final fallback]
//
// Sending flow (US-021):
//   1. setCustomFieldByName (cuf_14438749 = termsUrl)
//   2. sendFlow with TERMS_FLOW_NS

const MANYCHAT_API_BASE = "https://api.manychat.com";
const TERMS_URL_FIELD = "cuf_14438749";
// Flow NS for terms acceptance; can be overridden via MANYCHAT_TERMS_FLOW_NS env var
const TERMS_FLOW_NS =
  process.env.MANYCHAT_TERMS_FLOW_NS ?? "content20260331095255_664930";

type SendTermsWhatsAppParams = {
  to: string; // E.164 phone number, e.g. +85254304789
  termsUrl: string;
};

/** Remove leading + from a phone string (if present). */
function stripPlus(phone: string): string {
  return phone.startsWith("+") ? phone.slice(1) : phone;
}

/**
 * Try findBySystemField with a given field_name / field_value pair.
 * Returns subscriber ID string on success, null if not found / error.
 */
async function findSubscriberByField(
  fieldName: string,
  fieldValue: string,
  headers: Record<string, string>
): Promise<string | null> {
  console.log(
    `[manychat] findBySystemField attempt: field_name=${fieldName} field_value=${fieldValue}`
  );
  try {
    const res = await fetch(
      `${MANYCHAT_API_BASE}/fb/subscriber/findBySystemField`,
      {
        method: "POST",
        headers,
        body: JSON.stringify({ field_name: fieldName, field_value: fieldValue }),
      }
    );
    const data = res.ok ? await res.json() : null;
    console.log(
      `[manychat] findBySystemField HTTP ${res.status} (${fieldName}=${fieldValue}): ${JSON.stringify(data)}`
    );
    if (res.ok && data?.data?.id) {
      const id = String(data.data.id);
      console.log(
        `[manychat] Resolved subscriber_id=${id} via ${fieldName}=${fieldValue}`
      );
      return id;
    }
  } catch (err) {
    console.error(
      `[manychat] findBySystemField threw for ${fieldName}=${fieldValue}:`,
      err
    );
  }
  return null;
}

/**
 * Extract wa_id from a ManyChat createSubscriber 400 error body.
 * Handles: { data: { wa_id: "..." } } and { details: { wa_id: "..." } }
 * Falls back to regex extraction from the message string.
 */
function extractWaId(errorBody: unknown): string | null {
  if (typeof errorBody !== "object" || errorBody === null) return null;
  const body = errorBody as Record<string, unknown>;

  // Try data.wa_id
  const dataWaId =
    (body.data as Record<string, unknown> | undefined)?.wa_id;
  if (typeof dataWaId === "string" && dataWaId) return stripPlus(dataWaId);

  // Try details.wa_id
  const detailsWaId =
    (body.details as Record<string, unknown> | undefined)?.wa_id;
  if (typeof detailsWaId === "string" && detailsWaId)
    return stripPlus(detailsWaId);

  // Try parsing from message string, e.g. "WhatsApp ID already exists: 85262875094"
  const message = typeof body.message === "string" ? body.message : "";
  const match = message.match(/(\d{7,15})/);
  if (match) return match[1];

  return null;
}

export async function sendTermsAcceptanceWhatsApp({
  to,
  termsUrl,
}: SendTermsWhatsAppParams): Promise<boolean> {
  const apiKey = process.env.MANYCHAT_API_KEY;
  if (!apiKey) {
    console.error(
      "[manychat] MANYCHAT_API_KEY is not set — cannot send WhatsApp message"
    );
    return false;
  }

  const headers = {
    Authorization: `Bearer ${apiKey}`,
    "Content-Type": "application/json",
  };

  const phoneDigits = stripPlus(to); // e.g. "85254304789"

  // ── Step 1: Resolve subscriber ID ────────────────────────────────────────

  let subscriberId: string | null = null;

  // 1. findBySystemField with phone field (US-020: phone is reliably set at creation)
  subscriberId = await findSubscriberByField("phone", to, headers);

  // 2. Not found — try createSubscriber
  if (!subscriberId) {
    console.log(
      `[manychat] Subscriber not found for phone ${to} — attempting createSubscriber`
    );
    try {
      const createRes = await fetch(
        `${MANYCHAT_API_BASE}/fb/subscriber/createSubscriber`,
        {
          method: "POST",
          headers,
          body: JSON.stringify({
            whatsapp_phone: to,
            phone: to,
            consent_phrase: "Purchase confirmed",
            has_opt_in_sms: false,
            has_opt_in_email: false,
          }),
        }
      );
      const createData = await createRes.json();
      console.log(
        `[manychat] createSubscriber HTTP ${createRes.status} for phone ${to}: ${JSON.stringify(createData)}`
      );

      if (createRes.ok && createData?.data?.id) {
        subscriberId = String(createData.data.id);
        console.log(
          `[manychat] Created new subscriber_id=${subscriberId} for phone ${to}`
        );
      } else if (
        createRes.status === 400 &&
        typeof createData?.message === "string" &&
        createData.message.toLowerCase().includes("already exists")
      ) {
        // Subscriber already exists in ManyChat — resolve via wa_id lookup chain
        console.log(
          `[manychat] createSubscriber 400 "already exists" for phone ${to} — attempting wa_id lookup`
        );

        const waId = extractWaId(createData);
        if (waId) {
          // 3a. findBySystemField with wa_id
          subscriberId = await findSubscriberByField("wa_id", waId, headers);
        }

        // 3b. Final fallback: findBySystemField with phone without +
        if (!subscriberId) {
          subscriberId = await findSubscriberByField(
            "whatsapp_phone",
            phoneDigits,
            headers
          );
        }

        if (!subscriberId) {
          console.error(
            `[manychat] All lookup paths exhausted for phone ${to} after already-exists error`
          );
          return false;
        }
      } else {
        console.error(
          `[manychat] createSubscriber failed for phone ${to} — status=${createRes.status}`
        );
        return false;
      }
    } catch (err) {
      console.error(
        `[manychat] Error during createSubscriber for phone ${to}:`,
        err
      );
      return false;
    }
  }

  // ── Step 2: Set custom field (terms URL) ─────────────────────────────────
  try {
    const setFieldRes = await fetch(
      `${MANYCHAT_API_BASE}/fb/subscriber/setCustomFieldByName`,
      {
        method: "POST",
        headers,
        body: JSON.stringify({
          subscriber_id: subscriberId,
          field_name: TERMS_URL_FIELD,
          field_value: termsUrl,
        }),
      }
    );
    const setFieldBody = await setFieldRes.text();
    console.log(
      `[manychat] setCustomFieldByName response: status=${setFieldRes.status} body=${setFieldBody}`
    );
    if (!setFieldRes.ok) {
      console.error(
        `[manychat] setCustomFieldByName HTTP ${setFieldRes.status} for subscriber ${subscriberId}: ${setFieldBody}`
      );
      return false;
    }
  } catch (err) {
    console.error(
      `[manychat] Error setting custom field for subscriber ${subscriberId}:`,
      err
    );
    return false;
  }

  // ── Step 3: Send via sendFlow ─────────────────────────────────────────────
  try {
    const flowNs = TERMS_FLOW_NS;
    const sendRes = await fetch(
      `${MANYCHAT_API_BASE}/fb/sending/sendFlow`,
      {
        method: "POST",
        headers,
        body: JSON.stringify({
          subscriber_id: subscriberId,
          flow_ns: flowNs,
        }),
      }
    );

    const responseBody = await sendRes.text();
    console.log(
      `[manychat] sendFlow response: status=${sendRes.status} body=${responseBody}`
    );
    if (!sendRes.ok) {
      console.error(
        `[manychat] sendFlow HTTP ${sendRes.status} for subscriber ${subscriberId}: ${responseBody}`
      );
      return false;
    }

    return true;
  } catch (err) {
    console.error(
      `[manychat] Error sending flow to subscriber ${subscriberId}:`,
      err
    );
    return false;
  }
}
