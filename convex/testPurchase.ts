import { mutationGeneric, queryGeneric } from "convex/server";
import { v } from "convex/values";

export const createTestPurchase = mutationGeneric({
  args: {
    customer_mobile: v.string(),
    participant_count: v.optional(v.number()),
  },
  returns: v.object({
    purchase_id: v.id("purchases"),
    token: v.string(),
  }),
  handler: async (ctx, args) => {
    const now = Date.now();
    const token = crypto.randomUUID();
    const orderId = `ORD-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    const purchaseId = await ctx.db.insert("purchases", {
      order_id: orderId,
      customer_mobile: args.customer_mobile,
      purchase_datetime: new Date(now).toISOString(),
      participant_count: args.participant_count ?? 2,
      status: "pending_terms",
      token: token,
      created_at: now,
    });

    return {
      purchase_id: purchaseId,
      token: token,
    };
  },
});

export const generateCsvUploadUrl = mutationGeneric({
  args: {},
  returns: v.string(),
  handler: async (ctx) => {
    return await ctx.storage.generateUploadUrl();
  },
});

export const insertCsvFileRecord = mutationGeneric({
  args: {
    filename: v.string(),
    file_storage_id: v.string(),
  },
  returns: v.id("csv_files"),
  handler: async (ctx, args) => {
    return await ctx.db.insert("csv_files", {
      filename: args.filename,
      file_storage_id: args.file_storage_id,
      status: "pending",
      created_at: Date.now(),
    });
  },
});

export const setSessionQuotaUsed = mutationGeneric({
  args: {
    session_id: v.string(),
    quota_used: v.number(),
  },
  returns: v.object({ success: v.boolean() }),
  handler: async (ctx, args) => {
    const session = await ctx.db
      .query("sessions")
      .withIndex("by_session_id", (q) => q.eq("session_id", args.session_id))
      .first();
    if (!session) return { success: false };
    await ctx.db.patch(session._id, { quota_used: args.quota_used });
    return { success: true };
  },
});

export const getPurchaseByToken = queryGeneric({
  args: {
    token: v.string(),
  },
  returns: v.union(
    v.null(),
    v.object({
      order_id: v.string(),
      status: v.union(
        v.literal("pending_terms"),
        v.literal("confirmation_sent"),
        v.literal("terms_accepted"),
        v.literal("cancelled")
      ),
      session_id: v.optional(v.string()),
    })
  ),
  handler: async (ctx, args) => {
    const purchase = await ctx.db
      .query("purchases")
      .withIndex("by_token", (q) => q.eq("token", args.token))
      .first();
    if (!purchase) return null;
    return {
      order_id: purchase.order_id,
      status: purchase.status,
      session_id: purchase.session_id,
    };
  },
});

export const getParticipantsByToken = queryGeneric({
  args: {
    token: v.string(),
  },
  returns: v.array(
    v.object({
      participant_id: v.string(),
      session_id: v.string(),
      terms_accepted_at: v.optional(v.number()),
    })
  ),
  handler: async (ctx, args) => {
    const purchase = await ctx.db
      .query("purchases")
      .withIndex("by_token", (q) => q.eq("token", args.token))
      .first();
    if (!purchase) return [];
    const participants = await ctx.db
      .query("participants")
      .withIndex("by_session_id", (q) => q.eq("session_id", purchase.session_id ?? ""))
      .collect();
    const purchaseParticipants = participants.filter(
      (p) => p.purchase_id === purchase._id
    );
    return purchaseParticipants.map((p) => ({
      participant_id: p.participant_id,
      session_id: p.session_id,
      terms_accepted_at: p.terms_accepted_at,
    }));
  },
});

export const listPurchasesByOrderIds = queryGeneric({
  args: {
    order_ids: v.array(v.string()),
  },
  returns: v.array(
    v.object({
      order_id: v.string(),
      status: v.union(
        v.literal("pending_terms"),
        v.literal("confirmation_sent"),
        v.literal("terms_accepted"),
        v.literal("cancelled")
      ),
    })
  ),
  handler: async (ctx, args) => {
    const results = [];
    for (const orderId of args.order_ids) {
      const purchase = await ctx.db
        .query("purchases")
        .withIndex("by_order_id", (q) => q.eq("order_id", orderId))
        .first();
      if (purchase) {
        results.push({ order_id: purchase.order_id, status: purchase.status });
      }
    }
    return results;
  },
});
