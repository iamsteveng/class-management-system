"use node";

import { makeFunctionReference, internalActionGeneric } from "convex/server";
import { v } from "convex/values";

import { resolveAppBaseUrl } from "../lib/appBaseUrl";
import { sendOrderConfirmationWhatsApp } from "../lib/manychat";
import { buildOrderFields } from "../lib/orderMessage";

/** WhatsApps the Customer their booking: the Session, Venue and a link to everyone's QR. */
export const sendOrderConfirmation = internalActionGeneric({
  args: { hold_id: v.string() },
  returns: v.object({ success: v.boolean(), skipped: v.optional(v.boolean()) }),
  handler: async (ctx, args) => {
    const order = (await ctx.runQuery(makeFunctionReference<"query">("checkout:getOrderForConfirmation"), {
      hold_id: args.hold_id,
    })) as {
      customer_mobile: string;
      class_id: string;
      class_name_zh: string;
      session_date: string;
      session_time: string;
      session_end_time?: string;
      session_location_zh: string;
      session_google_maps_url?: string;
      participants: Array<{ participant_id: string; name: string }>;
    } | null;
    if (!order) {
      console.error(`[orderConfirmation] No completed order for hold ${args.hold_id}`);
      return { success: false };
    }

    const fields = buildOrderFields({
      baseUrl: resolveAppBaseUrl(process.env.APP_BASE_URL),
      classId: order.class_id,
      holdId: args.hold_id,
      classNameZh: order.class_name_zh,
      sessionDate: order.session_date,
      sessionTime: order.session_time,
      sessionEndTime: order.session_end_time,
      locationZh: order.session_location_zh,
    });

    const storedSubscriberId = (await ctx.runQuery(
      makeFunctionReference<"query">("manychatSubscribers:getByPhone"),
      { whatsapp_phone: order.customer_mobile }
    )) as string | null;

    const result = await sendOrderConfirmationWhatsApp({
      to: order.customer_mobile,
      fields,
      subscriberId: storedSubscriberId,
    });

    if (result.subscriberId && result.subscriberId !== storedSubscriberId) {
      await ctx.runMutation(makeFunctionReference<"mutation">("manychatSubscribers:upsertSubscriber"), {
        whatsapp_phone: order.customer_mobile,
        subscriber_id: result.subscriberId,
      });
    }
    console.log(`[orderConfirmation] hold=${args.hold_id} success=${result.success} skipped=${result.skipped ?? false}`);
    return { success: result.success, skipped: result.skipped };
  },
});
