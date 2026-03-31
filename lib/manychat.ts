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

    const findData = findRes.ok ? await findRes.json() : null;
    console.log(`[manychat] findBySystemField HTTP ${findRes.status} for phone ${to}: ${JSON.stringify(findData)}`);

    if (findRes.ok && findData?.data?.id) {
      // Existing subscriber found
      subscriberId = String(findData.data.id);
      console.log(`[manychat] Found existing subscriber_id=${subscriberId} for phone ${to}`);
    } else {
      // Subscriber not found — create a new contact
      console.log(`[manychat] Subscriber not found for phone ${to} — creating new contact`);
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
      console.log(`[manychat] createSubscriber HTTP ${createRes.status} for phone ${to}: ${JSON.stringify(createData)}`);
      if (!createRes.ok || !createData?.data?.id) {
        console.error(`[manychat] Failed to create subscriber for phone ${to}`);
        return false;
      }
      subscriberId = String(createData.data.id);
      console.log(`[manychat] Created new subscriber_id=${subscriberId} for phone ${to}`);
    }
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

    const responseBody = await sendRes.text();
    console.log(`[manychat] sendContent response: status=${sendRes.status} body=${responseBody}`);
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
