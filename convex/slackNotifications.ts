"use node";

import { actionGeneric } from "convex/server";
import { v } from "convex/values";

import { sendTermsAcceptanceSlack } from "../lib/slack";

export const notifyTermsAccepted = actionGeneric({
  args: {
    class_name_zh: v.string(),
    session_date: v.string(),
    session_time: v.string(),
    session_location_zh: v.string(),
    participant_name: v.string(),
  },
  returns: v.object({ success: v.boolean() }),
  handler: async (_ctx, args) => {
    console.log(
      `[slackNotifications] Sending terms-accepted notification class="${args.class_name_zh}" session=${args.session_date}`
    );
    const result = await sendTermsAcceptanceSlack({
      classNameZh: args.class_name_zh,
      sessionDate: args.session_date,
      sessionTime: args.session_time,
      sessionLocationZh: args.session_location_zh,
      participantName: args.participant_name,
    });
    if (!result.success) {
      console.error(
        `[slackNotifications] Slack notification failed for class="${args.class_name_zh}" session=${args.session_date}`
      );
    }
    return result;
  },
});
