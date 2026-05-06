"use node";

import { actionGeneric, makeFunctionReference } from "convex/server";
import { v } from "convex/values";

import { sendRainCancellationWhatsApp } from "../lib/manychat";
import { buildParticipantPassUrl, resolveAppBaseUrl } from "../lib/appBaseUrl";
import { normalizeToE164 } from "../lib/phone";

export const sendRainCancellationNotification = actionGeneric({
  args: {
    participant_id: v.string(),
  },
  returns: v.object({
    success: v.boolean(),
  }),
  handler: async (ctx, args) => {
    // Fetch participant.mobile — use participant record, NOT purchase mobile
    const participant = await ctx.runQuery(
      makeFunctionReference<"query">("participants:getParticipantMobileById"),
      { participant_id: args.participant_id }
    );

    if (!participant) {
      console.error(`[rainCancel] Participant not found: ${args.participant_id}`);
      return { success: false };
    }

    if (!participant.mobile) {
      console.warn(`[rainCancel] Participant ${args.participant_id} has no mobile — skipping`);
      return { success: false };
    }

    // Safety-net: normalize to E.164 for existing records stored without country code
    const normalizedMobile = normalizeToE164(participant.mobile) ?? participant.mobile;

    // Look up stored ManyChat subscriber ID (avoids createSubscriber on repeat sends)
    const storedSubscriberId = await ctx.runQuery(
      makeFunctionReference<"query">("manychatSubscribers:getByPhone"),
      { whatsapp_phone: normalizedMobile }
    );

    const baseUrl = resolveAppBaseUrl(process.env.APP_BASE_URL);
    const participantPassUrl = buildParticipantPassUrl(baseUrl, args.participant_id);

    console.log(
      `[rainCancel] Sending WhatsApp to=${normalizedMobile} passUrl=${participantPassUrl} participant_id=${args.participant_id} storedSubscriberId=${storedSubscriberId ?? "none"}`
    );

    const result = await sendRainCancellationWhatsApp({
      to: normalizedMobile,
      participantPassUrl,
      subscriberId: storedSubscriberId,
    });

    console.log(
      `[rainCancel] Result: success=${result.success} subscriberId=${result.subscriberId ?? "null"}`
    );

    if (result.success && result.subscriberId) {
      await ctx.runMutation(
        makeFunctionReference<"mutation">("manychatSubscribers:upsertSubscriber"),
        {
          whatsapp_phone: normalizedMobile,
          subscriber_id: result.subscriberId,
        }
      );
    }

    return { success: result.success };
  },
});
