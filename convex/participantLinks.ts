"use node";

import { actionGeneric } from "convex/server";
import { v } from "convex/values";

import {
  getTwilioCredentialsFromConvexEnv,
  sendWhatsApp,
} from "../lib/twilio";

const DEFAULT_BASE_URL = "https://example.com";

export const sendParticipantLinks = actionGeneric({
  args: {
    customer_mobile: v.string(),
    participant_ids: v.array(v.string()),
  },
  returns: v.object({
    success: v.boolean(),
  }),
  handler: async (_ctx, args) => {
    if (args.participant_ids.length === 0) {
      return { success: false };
    }

    const baseUrl = resolveBaseUrl(process.env.APP_BASE_URL);
    const participantLinks = args.participant_ids.map(
      (participantId, index) =>
        `${index + 1}. ${baseUrl}/participant/${encodeURIComponent(participantId)}`
    );

    const message =
      participantLinks.length === 1
        ? `Your participant QR link: ${baseUrl}/participant/${encodeURIComponent(
            args.participant_ids[0]
          )}`
        : `Your participant QR links:\n${participantLinks.join("\n")}`;

    const sent = await sendWhatsApp({
      to: args.customer_mobile,
      message,
      credentials:
        getTwilioCredentialsFromConvexEnv({
          get: (name) => process.env[name],
        }) ?? undefined,
    });

    return { success: sent };
  },
});

function resolveBaseUrl(baseUrlFromEnv: string | undefined): string {
  const raw = baseUrlFromEnv?.trim();
  if (!raw) {
    return DEFAULT_BASE_URL;
  }

  if (raw.startsWith("http://") || raw.startsWith("https://")) {
    return raw.replace(/\/+$/, "");
  }

  return `https://${raw.replace(/\/+$/, "")}`;
}
