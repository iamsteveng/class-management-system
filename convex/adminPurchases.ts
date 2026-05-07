import { queryGeneric } from "convex/server";
import { v } from "convex/values";

export const listPurchases = queryGeneric({
  args: {},
  returns: v.array(
    v.object({
      _id: v.id("purchases"),
      created_at: v.number(),
      customer_mobile: v.string(),
      source: v.optional(v.union(v.literal("s3"), v.literal("payment_gateway"))),
      order_id: v.string(),
      participant_count: v.number(),
      slot_index: v.optional(v.number()),
      class_name: v.optional(v.string()),
      class_id: v.optional(v.string()),
      session_id: v.optional(v.string()),
      session_location_zh: v.optional(v.string()),
      session_location_en: v.optional(v.string()),
      session_date: v.optional(v.string()),
      session_time: v.optional(v.string()),
      status: v.union(
        v.literal("pending_terms"),
        v.literal("confirmation_sent"),
        v.literal("terms_accepted"),
        v.literal("cancelled")
      ),
    })
  ),
  handler: async (ctx) => {
    const purchases = await ctx.db
      .query("purchases")
      .order("desc")
      .collect();

    const classes = await ctx.db.query("classes").collect();
    const classByClassId = new Map(
      classes.map((c) => [c.class_id, c.name_zh ?? c.name_en])
    );

    const sessions = await ctx.db.query("sessions").collect();
    const sessionBySessionId = new Map(
      sessions.map((s) => [s.session_id, s])
    );

    return purchases.map((p) => {
      const session = p.session_id ? sessionBySessionId.get(p.session_id) : undefined;
      return {
        _id: p._id,
        created_at: p.created_at,
        customer_mobile: p.customer_mobile,
        source: p.source,
        order_id: p.order_id,
        participant_count: p.participant_count,
        slot_index: p.slot_index,
        class_name: p.class_id ? classByClassId.get(p.class_id) : undefined,
        class_id: p.class_id,
        session_id: p.session_id,
        session_location_zh: session?.location_zh,
        session_location_en: session?.location_en,
        session_date: session?.date,
        session_time: session?.time,
        status: p.status,
      };
    });
  },
});
