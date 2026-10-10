export type SlackTermsAcceptedParams = {
  classNameZh: string;
  sessionDate: string;
  sessionTime: string;
  sessionLocationZh: string;
  participantName: string;
};

// Escape Slack mrkdwn special characters to prevent @-mentions, link spoofing,
// and formatting injection from user-supplied strings.
function esc(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

export async function sendTermsAcceptanceSlack(
  params: SlackTermsAcceptedParams
): Promise<{ success: boolean }> {
  const webhookUrl = process.env.SLACK_WEBHOOK_URL;
  if (!webhookUrl) {
    console.error(
      "[slack] SLACK_WEBHOOK_URL is not set — cannot send Slack notification"
    );
    return { success: false };
  }

  const { classNameZh, sessionDate, sessionTime, sessionLocationZh, participantName } = params;

  const isProduction = process.env.APP_ENV === "prod";
  const headerText = isProduction
    ? "📋 New Class Registration"
    : "[TEST] 📋 New Class Registration";

  const payload = {
    blocks: [
      {
        type: "header",
        text: { type: "plain_text", text: headerText },
      },
      {
        type: "section",
        fields: [
          { type: "mrkdwn", text: `*Class:*\n${esc(classNameZh)}` },
          {
            type: "mrkdwn",
            text: `*Session:*\n${esc(sessionDate)} ${esc(sessionTime)}`,
          },
          { type: "mrkdwn", text: `*Location:*\n${esc(sessionLocationZh)}` },
          { type: "mrkdwn", text: `*Participant:*\n${esc(participantName)}` },
        ],
      },
    ],
  };

  try {
    const res = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const body = await res.text();
      console.error(`[slack] Webhook returned ${res.status}: ${body}`);
      return { success: false };
    }
    return { success: true };
  } catch (err) {
    console.error("[slack] Failed to send notification:", err);
    return { success: false };
  }
}

export type SlackLatePaymentRefundParams = {
  refunded: boolean;
  customerMobile: string;
  sessionDate: string;
  sessionTime: string;
  sessionLocationZh: string;
  quantity: number;
  amount: number;
  currency: string;
  intentId: string;
  error?: string;
};

/**
 * Tells staff a payment arrived after its Seat Hold lapsed and the Session had no room
 * left, so the Order was refunded instead of seated (or the refund failed).
 */
export async function sendLatePaymentRefundSlack(
  params: SlackLatePaymentRefundParams
): Promise<{ success: boolean }> {
  const webhookUrl = process.env.SLACK_WEBHOOK_URL;
  if (!webhookUrl) {
    console.error("[slack] SLACK_WEBHOOK_URL is not set — cannot send Slack notification");
    return { success: false };
  }

  const prefix = process.env.APP_ENV === "prod" ? "" : "[TEST] ";
  const headerText = params.refunded
    ? `${prefix}↩️ Late payment refunded — session was full`
    : `${prefix}⚠️ Late payment refund FAILED — refund manually`;

  const fields = [
    { type: "mrkdwn", text: `*Customer:*\n${esc(params.customerMobile)}` },
    {
      type: "mrkdwn",
      text: `*Session:*\n${esc(params.sessionDate)} ${esc(params.sessionTime)} ${esc(params.sessionLocationZh)}`,
    },
    { type: "mrkdwn", text: `*People:*\n${params.quantity}` },
    { type: "mrkdwn", text: `*Amount:*\n${esc(params.currency)} ${params.amount}` },
    { type: "mrkdwn", text: `*Payment intent:*\n${esc(params.intentId)}` },
  ];
  if (params.error) fields.push({ type: "mrkdwn", text: `*Error:*\n${esc(params.error)}` });

  try {
    const res = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        blocks: [
          { type: "header", text: { type: "plain_text", text: headerText } },
          { type: "section", fields },
          {
            type: "context",
            elements: [
              {
                type: "mrkdwn",
                text: "Please WhatsApp the Customer to explain and offer another Session.",
              },
            ],
          },
        ],
      }),
    });
    if (!res.ok) {
      console.error(`[slack] Webhook returned ${res.status}: ${await res.text()}`);
      return { success: false };
    }
    return { success: true };
  } catch (err) {
    console.error("[slack] Failed to send notification:", err);
    return { success: false };
  }
}
