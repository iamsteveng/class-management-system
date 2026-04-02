import { mutationGeneric } from "convex/server";
import { v } from "convex/values";
import type { Id } from "./_generated/dataModel";

/** Records an ingestion run to the ingestion_runs table (US-008). */
export const recordIngestionRun = mutationGeneric({
  args: {
    status: v.union(
      v.literal("success"),
      v.literal("partial"),
      v.literal("error")
    ),
    files_processed: v.number(),
    rows_inserted: v.number(),
    rows_skipped: v.number(),
    whatsapp_errors: v.optional(v.number()),
    error_message: v.optional(v.string()),
  },
  returns: v.id("ingestion_runs"),
  handler: async (ctx, args) => {
    // Override status to partial if WhatsApp errors occurred on an otherwise successful run
    let finalStatus = args.status;
    if ((args.whatsapp_errors ?? 0) > 0 && finalStatus === "success") {
      finalStatus = "partial";
    }

    return await ctx.db.insert("ingestion_runs", {
      run_at: Date.now(),
      status: finalStatus,
      files_processed: args.files_processed,
      rows_inserted: args.rows_inserted,
      rows_skipped: args.rows_skipped,
      whatsapp_errors: args.whatsapp_errors,
      error_message: args.error_message,
    });
  },
});

/**
 * Processes parsed CSV rows: creates purchase records.
 * Returns counts of inserted and skipped rows, plus the IDs of newly inserted purchases
 * so the caller (action) can send WhatsApp notifications and track failures.
 */
export const applyS3CsvRows = mutationGeneric({
  args: {
    rows: v.array(
      v.object({
        order_id: v.string(),
        class_id: v.optional(v.string()),
        customer_mobile: v.string(),
        participant_count: v.number(),
        unit_price: v.number(),
        total_price: v.number(),
        purchase_datetime: v.string(),
      })
    ),
  },
  returns: v.object({
    rows_inserted: v.number(),
    rows_skipped: v.number(),
    purchase_ids: v.array(v.id("purchases")),
  }),
  handler: async (ctx, args) => {
    const now = Date.now();
    let inserted = 0;
    let skipped = 0;
    const purchaseIds: Id<"purchases">[] = [];

    for (const row of args.rows) {
      // Duplicate detection: same order_id + class_id
      const existing = await ctx.db
        .query("purchases")
        .withIndex("by_order_id", (q) => q.eq("order_id", row.order_id))
        .filter((q) =>
          row.class_id
            ? q.eq(q.field("class_id"), row.class_id)
            : q.eq(q.field("class_id"), undefined)
        )
        .first();

      if (existing) {
        skipped += 1;
        continue;
      }

      const purchaseId = await ctx.db.insert("purchases", {
        order_id: row.order_id,
        customer_mobile: row.customer_mobile,
        purchase_datetime: row.purchase_datetime,
        participant_count: row.participant_count,
        status: "pending_terms",
        token: crypto.randomUUID(),
        class_id: row.class_id,
        source: "s3",
        unit_price: row.unit_price,
        total_price: row.total_price,
        created_at: now,
      });

      purchaseIds.push(purchaseId);
      inserted += 1;
    }

    return { rows_inserted: inserted, rows_skipped: skipped, purchase_ids: purchaseIds };
  },
});
