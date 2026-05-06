import { mutationGeneric, queryGeneric } from "convex/server";
import { v } from "convex/values";
import { buildTermsUrl, resolveAppBaseUrl } from "../lib/appBaseUrl";

export const createTestPurchase = mutationGeneric({
  args: {
    customer_mobile: v.string(),
    participant_count: v.optional(v.number()),
    class_id: v.optional(v.string()),
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
      class_id: args.class_id,
      created_at: now,
    });

    return {
      purchase_id: purchaseId,
      token: token,
    };
  },
});

export const createTestParticipant = mutationGeneric({
  args: {
    session_id: v.string(),
    name: v.optional(v.string()),
    mobile: v.optional(v.string()),
  },
  returns: v.object({
    participant_id: v.string(),
    purchase_id: v.id("purchases"),
  }),
  handler: async (ctx, args) => {
    const now = Date.now();
    const token = crypto.randomUUID();
    const orderId = `ORD-TEST-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    const purchaseId = await ctx.db.insert("purchases", {
      order_id: orderId,
      customer_mobile: args.mobile ?? "+60000000000",
      purchase_datetime: new Date(now).toISOString(),
      participant_count: 1,
      status: "pending_terms",
      token: token,
      session_id: args.session_id,
      created_at: now,
    });

    const participantId = crypto.randomUUID();

    await ctx.db.insert("participants", {
      participant_id: participantId,
      purchase_id: purchaseId,
      session_id: args.session_id,
      name: args.name,
      mobile: args.mobile,
      created_at: now,
    });

    return {
      participant_id: participantId,
      purchase_id: purchaseId,
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

export const getParticipantsFullByToken = queryGeneric({
  args: {
    token: v.string(),
  },
  returns: v.array(
    v.object({
      participant_id: v.string(),
      session_id: v.string(),
      terms_accepted_at: v.optional(v.number()),
      height: v.optional(v.float64()),
      age: v.optional(v.number()),
      emergency_contact_name: v.optional(v.string()),
      emergency_contact_phone: v.optional(v.string()),
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
      height: p.height,
      age: p.age,
      emergency_contact_name: p.emergency_contact_name,
      emergency_contact_phone: p.emergency_contact_phone,
    }));
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

export const previewPurchaseConfirmationMessage = queryGeneric({
  args: {
    token: v.string(),
    app_base_url: v.optional(v.string()),
  },
  returns: v.union(
    v.null(),
    v.object({
      base_url: v.string(),
      terms_link: v.string(),
      message: v.string(),
    })
  ),
  handler: async (ctx, args) => {
    const purchase = await ctx.db
      .query("purchases")
      .withIndex("by_token", (q) => q.eq("token", args.token))
      .first();
    if (!purchase) return null;

    const baseUrl = resolveAppBaseUrl(args.app_base_url ?? process.env.APP_BASE_URL);
    const termsLink = buildTermsUrl(baseUrl, purchase.token);
    return {
      base_url: baseUrl,
      terms_link: termsLink,
      message: `Your purchase is confirmed! Please accept terms: ${termsLink}`,
    };
  },
});

export const getLatestAuditLogForEntity = queryGeneric({
  args: {
    entity_type: v.string(),
    entity_id: v.string(),
  },
  returns: v.union(
    v.null(),
    v.object({
      action: v.string(),
      entity_type: v.string(),
      entity_id: v.string(),
      created_at: v.number(),
    })
  ),
  handler: async (ctx, args) => {
    const rows = await ctx.db.query("audit_logs").collect();
    const filtered = rows.filter(
      (row) => row.entity_type === args.entity_type && row.entity_id === args.entity_id
    );
    if (filtered.length === 0) {
      return null;
    }
    const latest = filtered.sort((a, b) => b.created_at - a.created_at)[0];
    return {
      action: latest.action,
      entity_type: latest.entity_type,
      entity_id: latest.entity_id,
      created_at: latest.created_at,
    };
  },
});

export const getAuditLogsForEntity = queryGeneric({
  args: {
    entity_type: v.string(),
    entity_id: v.string(),
  },
  returns: v.array(
    v.object({
      action: v.string(),
      entity_type: v.string(),
      entity_id: v.string(),
      created_at: v.number(),
    })
  ),
  handler: async (ctx, args) => {
    const rows = await ctx.db.query("audit_logs").collect();
    return rows
      .filter(
        (row) => row.entity_type === args.entity_type && row.entity_id === args.entity_id
      )
      .sort((a, b) => a.created_at - b.created_at)
      .map((row) => ({
        action: row.action,
        entity_type: row.entity_type,
        entity_id: row.entity_id,
        created_at: row.created_at,
      }));
  },
});

export const deleteAllFaqs = mutationGeneric({
  args: {},
  returns: v.number(),
  handler: async (ctx) => {
    const faqs = await ctx.db.query("faqs").collect();
    for (const faq of faqs) {
      await ctx.db.delete(faq._id);
    }
    return faqs.length;
  },
});

export const debugTermsQuery = queryGeneric({
  args: { token: v.string() },
  returns: v.any(),
  handler: async (ctx, args) => {
    const purchase = await ctx.db
      .query("purchases")
      .withIndex("by_token", (q) => q.eq("token", args.token))
      .first();
    if (!purchase) return { step: "no_purchase" };

    const currentTerms = await ctx.db
      .query("terms_versions")
      .withIndex("by_is_current", (q) => q.eq("is_current", true))
      .first();
    if (!currentTerms) return { step: "no_terms" };

    const sessions = await ctx.db.query("sessions").collect();
    const scheduled = sessions.filter((s) => s.status === "scheduled");
    const withQuota = scheduled.filter((s) => s.quota_defined - s.quota_used > 0);

    return {
      step: "ok",
      purchase_status: purchase.status,
      class_id: purchase.class_id,
      terms_version: currentTerms.version,
      total_sessions: sessions.length,
      scheduled_count: scheduled.length,
      with_quota_count: withQuota.length,
      sample_session: withQuota[0],
    };
  },
});

/** Seeds N ingestion_runs records for testing TC-037. */
export const seedIngestionRuns = mutationGeneric({
  args: { count: v.number() },
  returns: v.null(),
  handler: async (ctx, args) => {
    const statuses: Array<"success" | "partial" | "error"> = ["success", "partial", "error"];
    for (let i = 0; i < args.count; i++) {
      const status = statuses[i % 3];
      await ctx.db.insert("ingestion_runs", {
        run_at: Date.now() - i * 60000,
        status,
        files_processed: i + 1,
        rows_inserted: (i + 1) * 10,
        rows_skipped: i,
        error_message: status === "error" ? `Test error ${i}` : undefined,
      });
    }
    return null;
  },
});
