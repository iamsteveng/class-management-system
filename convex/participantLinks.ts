"use node";

import { actionGeneric } from "convex/server";
import { v } from "convex/values";

// WhatsApp sending has been removed from this action (previously used Twilio).
// Participant links are now communicated via the terms acceptance success page.
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

    return { success: true };
  },
});
