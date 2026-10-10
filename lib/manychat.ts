// ManyChat WhatsApp integration.
//
// Every message is a ManyChat flow whose only step sends an approved WhatsApp template.
// The app fills the template's variables by setting single-line custom fields on the
// subscriber, then starts the flow:
//   1. Use the stored subscriber ID, or create the subscriber.
//   2. setCustomFields with the message's values.
//   3. sendFlow.
// Each message is configured by its flow namespace and one env var per field ID (cuf_…);
// until all are set, the send is skipped and logged.

const MANYCHAT_API_BASE = "https://api.manychat.com";

export type SendWhatsAppResult = {
  success: boolean;
  subscriberId: string | null;
  skipped?: boolean;
};

type MessageConfig<F extends string> = {
  label: string;
  flowNsEnv: string;
  fieldEnvs: Record<F, string>;
};

/** Remove leading + from a phone string (if present). */
function stripPlus(phone: string): string {
  return phone.startsWith("+") ? phone.slice(1) : phone;
}

async function sendTemplateFlow<F extends string>(
  config: MessageConfig<F>,
  params: { to: string; fields: Record<F, string>; subscriberId?: string | null }
): Promise<SendWhatsAppResult> {
  const apiKey = process.env.MANYCHAT_API_KEY;
  const flowNs = process.env[config.flowNsEnv] ?? "";
  const names = Object.keys(config.fieldEnvs) as F[];
  const fieldIds = Object.fromEntries(names.map((name) => [name, process.env[config.fieldEnvs[name]] ?? ""])) as Record<F, string>;
  if (!apiKey || !flowNs || names.some((name) => !fieldIds[name])) {
    console.warn(
      `[manychat] ${config.label} not configured (MANYCHAT_API_KEY / ${config.flowNsEnv} / ${Object.values(config.fieldEnvs).join(" / ")}) — skipping WhatsApp`
    );
    return { success: false, subscriberId: null, skipped: true };
  }

  const headers = { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" };
  let subscriberId: string | null = params.subscriberId ?? null;

  try {
    if (!subscriberId) {
      const createRes = await fetch(`${MANYCHAT_API_BASE}/fb/subscriber/createSubscriber`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          whatsapp_phone: params.to,
          phone: stripPlus(params.to),
          has_opt_in_whatsapp: true,
          has_opt_in_sms: false,
          has_opt_in_email: false,
          consent_phrase: "User agreed to receive WhatsApp messages",
        }),
      });
      const createData = await createRes.json();
      if (!createRes.ok || !createData?.data?.id) {
        console.error(
          `[manychat] createSubscriber failed for ${params.to}: ${createRes.status} ${JSON.stringify(createData)}`
        );
        return { success: false, subscriberId: null };
      }
      subscriberId = String(createData.data.id);
    }

    const setFieldRes = await fetch(`${MANYCHAT_API_BASE}/fb/subscriber/setCustomFields`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        subscriber_id: Number(subscriberId),
        fields: names.map((name) => ({
          field_id: Number(fieldIds[name].replace("cuf_", "")),
          field_value: params.fields[name],
        })),
      }),
    });
    if (!setFieldRes.ok) {
      console.error(`[manychat] setCustomFields (${config.label}) failed: ${setFieldRes.status} ${await setFieldRes.text()}`);
      return { success: false, subscriberId };
    }

    const sendRes = await fetch(`${MANYCHAT_API_BASE}/fb/sending/sendFlow`, {
      method: "POST",
      headers,
      body: JSON.stringify({ subscriber_id: subscriberId, flow_ns: flowNs }),
    });
    if (!sendRes.ok) {
      console.error(`[manychat] sendFlow (${config.label}) failed: ${sendRes.status} ${await sendRes.text()}`);
      return { success: false, subscriberId };
    }
    return { success: true, subscriberId };
  } catch (err) {
    console.error(`[manychat] ${config.label} to ${params.to} failed:`, err);
    return { success: false, subscriberId };
  }
}

// ── Booking confirmation: once to the Customer when an Order is paid ──────────

export type OrderMessageFields = {
  booking_class: string;
  booking_when: string;
  booking_venue: string;
  booking_link: string;
};

export function sendOrderConfirmationWhatsApp(params: {
  to: string;
  fields: OrderMessageFields;
  subscriberId?: string | null;
}) {
  return sendTemplateFlow<keyof OrderMessageFields>(
    {
      label: "Order confirmation",
      flowNsEnv: "MANYCHAT_ORDER_FLOW_NS",
      fieldEnvs: {
        booking_class: "MANYCHAT_ORDER_FIELD_CLASS",
        booking_when: "MANYCHAT_ORDER_FIELD_WHEN",
        booking_venue: "MANYCHAT_ORDER_FIELD_VENUE",
        booking_link: "MANYCHAT_ORDER_FIELD_LINK",
      },
    },
    params
  );
}

// ── Rain cancellation: to each Participant of a rain-cancelled Session ────────

export type RainMessageFields = {
  rain_class: string;
  rain_when: string;
  rain_venue: string;
  rain_link: string;
};

export function sendRainCancellationWhatsApp(params: {
  to: string;
  fields: RainMessageFields;
  subscriberId?: string | null;
}) {
  return sendTemplateFlow<keyof RainMessageFields>(
    {
      label: "Rain cancellation",
      flowNsEnv: "MANYCHAT_RAIN_FLOW_NS",
      fieldEnvs: {
        rain_class: "MANYCHAT_RAIN_FIELD_CLASS",
        rain_when: "MANYCHAT_RAIN_FIELD_WHEN",
        rain_venue: "MANYCHAT_RAIN_FIELD_VENUE",
        rain_link: "MANYCHAT_RAIN_FIELD_LINK",
      },
    },
    params
  );
}
