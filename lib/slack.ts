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

  const payload = {
    blocks: [
      {
        type: "header",
        text: { type: "plain_text", text: "📋 New Class Registration" },
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
