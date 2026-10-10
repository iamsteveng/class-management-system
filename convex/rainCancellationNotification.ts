"use node";

import { internalActionGeneric, makeFunctionReference } from "convex/server";
import { v } from "convex/values";

import { resolveAppBaseUrl } from "../lib/appBaseUrl";
import { sendRainCancellationWhatsApp } from "../lib/manychat";
import { buildRainFields } from "../lib/orderMessage";
import { normalizeToE164 } from "../lib/phone";

/** WhatsApps one Participant that their Session was rained off, with their link to rebook. */
export const sendRainCancellationNotification = internalActionGeneric({
  args: {
    participant_id: v.string(),
  },
  returns: v.object({
    success: v.boolean(),
  }),
  handler: async (ctx, args) => {
    const details = (await ctx.runQuery(makeFunctionReference<"query">("participants:getRainNoticeDetails"), {
      participant_id: args.participant_id,
    })) as {
      mobile: string | null;
      class_name_zh: string;
      session_date: string;
      session_time: string;
      session_end_time?: string;
      session_location_zh: string;
    } | null;

    if (!details) {
      console.error(`[rainCancel] Participant not found: ${args.participant_id}`);
      return { success: false };
    }
    if (!details.mobile) {
      console.warn(`[rainCancel] Participant ${args.participant_id} has no mobile — skipping`);
      return { success: false };
    }

    // The Participant's own mobile: they receive every message about their Session.
    const to = normalizeToE164(details.mobile) ?? details.mobile;
    const storedSubscriberId = (await ctx.runQuery(makeFunctionReference<"query">("manychatSubscribers:getByPhone"), {
      whatsapp_phone: to,
    })) as string | null;

    const result = await sendRainCancellationWhatsApp({
      to,
      subscriberId: storedSubscriberId,
      fields: buildRainFields({
        baseUrl: resolveAppBaseUrl(process.env.APP_BASE_URL),
        participantId: args.participant_id,
        classNameZh: details.class_name_zh,
        sessionDate: details.session_date,
        sessionTime: details.session_time,
        sessionEndTime: details.session_end_time,
        locationZh: details.session_location_zh,
      }),
    });

    if (result.subscriberId && result.subscriberId !== storedSubscriberId) {
      await ctx.runMutation(makeFunctionReference<"mutation">("manychatSubscribers:upsertSubscriber"), {
        whatsapp_phone: to,
        subscriber_id: result.subscriberId,
      });
    }
    console.log(
      `[rainCancel] participant=${args.participant_id} success=${result.success} skipped=${result.skipped ?? false}`
    );
    return { success: result.success };
  },
});
