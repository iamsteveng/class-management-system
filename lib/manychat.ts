// ManyChat WhatsApp integration
// sendTermsAcceptanceWhatsApp resolves subscriber ID by phone and sends
// an approved template message with the terms URL as a custom field.
//
// Lookup chain (US-019):
//   1. findBySystemField(whatsapp_phone, E.164 with +)
//   2. findBySystemField(whatsapp_phone, digits only, no +)
//   3. createSubscriber — if 400 "WhatsApp ID already exists":
//      3a. findBySystemField(wa_id, extracted wa_id)
//      3b. findBySystemField(whatsapp_phone, digits only, no +) [final fallback]

const MANYCHAT_API_BASE = "https://api.manychat.com";
const TERMS_TEMPLATE_NAME = "Terms acceptance";
const TERMS_URL_FIELD = "cuf_14438749";

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

  // 1a. findBySystemField with E.164 (with +)
  subscriberId = await findSubscriberByField("whatsapp_phone", to, headers);

  // 1b. Fallback: findBySystemField without + prefix
  if (!subscriberId) {
    subscriberId = await findSubscriberByField(
      "whatsapp_phone",
      phoneDigits,
      headers
    );
  }

  // 1c. Still not found — try createSubscriber
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

  // ── Step 2: Send the approved template message ────────────────────────────
  try {
    const sendRes = await fetch(
      `${MANYCHAT_API_BASE}/fb/sending/sendContent`,
      {
        method: "POST",
        headers,
        body: JSON.stringify({
          subscriber_id: subscriberId,
          data: {
            version: "v2",
            content: {
              messages: [
                {
                  type: "whatsapp_template",
                  name: TERMS_TEMPLATE_NAME,
                },
              ],
            },
          },
          custom_fields: {
            [TERMS_URL_FIELD]: termsUrl,
          },
        }),
      }
    );

    const responseBody = await sendRes.text();
    console.log(
      `[manychat] sendContent response: status=${sendRes.status} body=${responseBody}`
    );
    if (!sendRes.ok) {
      console.error(
        `[manychat] sendContent HTTP ${sendRes.status} for subscriber ${subscriberId}: ${responseBody}`
      );
      return false;
    }

    return true;
  } catch (err) {
    console.error(
      `[manychat] Error sending template to subscriber ${subscriberId}:`,
      err
    );
    return false;
  }
}
