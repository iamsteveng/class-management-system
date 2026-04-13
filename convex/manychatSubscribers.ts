import { mutationGeneric, queryGeneric } from "convex/server";
import { v } from "convex/values";

/**
 * Look up a ManyChat subscriber ID by WhatsApp phone number.
 * Returns the subscriber_id string, or null if not found.
 */
export const getByPhone = queryGeneric({
  args: {
    whatsapp_phone: v.string(),
  },
  returns: v.union(v.string(), v.null()),
  handler: async (ctx, args) => {
    const record = await ctx.db
      .query("manychat_subscribers")
      .withIndex("by_whatsapp_phone", (q) =>
        q.eq("whatsapp_phone", args.whatsapp_phone)
      )
      .first();
    return record?.subscriber_id ?? null;
  },
});

/**
 * Insert or update a ManyChat subscriber record keyed by WhatsApp phone number.
 */
export const upsertSubscriber = mutationGeneric({
  args: {
    whatsapp_phone: v.string(),
    subscriber_id: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("manychat_subscribers")
      .withIndex("by_whatsapp_phone", (q) =>
        q.eq("whatsapp_phone", args.whatsapp_phone)
      )
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, { subscriber_id: args.subscriber_id });
    } else {
      await ctx.db.insert("manychat_subscribers", {
        whatsapp_phone: args.whatsapp_phone,
        subscriber_id: args.subscriber_id,
        created_at: Date.now(),
      });
    }
    return null;
  },
});
