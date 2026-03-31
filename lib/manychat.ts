// ManyChat WhatsApp integration
// sendTermsAcceptanceWhatsApp resolves subscriber ID by phone and sends
// an approved template message with the terms URL as a custom field.

const MANYCHAT_API_BASE = "https://api.manychat.com";
const TERMS_TEMPLATE_NAME = "Terms acceptance";
const TERMS_URL_FIELD = "cuf_14438749";

type SendTermsWhatsAppParams = {
  to: string; // E.164 phone number, e.g. +85254304789
  termsUrl: string;
};

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

  // Step 1: Resolve subscriber ID from phone number
  let subscriberId: string;
  try {
    const findRes = await fetch(
      `${MANYCHAT_API_BASE}/fb/subscriber/findBySystemField`,
      {
        method: "POST",
        headers,
        body: JSON.stringify({
          field_name: "whatsapp_phone",
          field_value: to,
        }),
      }
    );

    if (!findRes.ok) {
      console.warn(
        `[manychat] findBySystemField HTTP ${findRes.status} for phone ${to}`
      );
      return false;
    }

    const findData = await findRes.json();
    if (!findData?.data?.id) {
      console.warn(
        `[manychat] Subscriber not found for phone ${to} — skipping WhatsApp send`
      );
      return false;
    }

    subscriberId = String(findData.data.id);
  } catch (err) {
    console.error(
      `[manychat] Error resolving subscriber for phone ${to}:`,
      err
    );
    return false;
  }

  // Step 2: Send the approved template message
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

    if (!sendRes.ok) {
      const body = await sendRes.text();
      console.error(
        `[manychat] sendContent HTTP ${sendRes.status} for subscriber ${subscriberId}: ${body}`
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
