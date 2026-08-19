import { mutationGeneric } from "convex/server";
import { v } from "convex/values";
import type { Id } from "./_generated/dataModel";

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
      // For each slot (one per participant count), create a separate purchase record
      for (let slotIndex = 0; slotIndex < row.participant_count; slotIndex++) {
        // Duplicate detection: same order_id + class_id + slot_index
        const existing = await ctx.db
          .query("purchases")
          .withIndex("by_order_class_slot", (q) =>
            q.eq("order_id", row.order_id)
          )
          .filter((q) =>
            q.and(
              row.class_id
                ? q.eq(q.field("class_id"), row.class_id)
                : q.eq(q.field("class_id"), undefined),
              q.eq(q.field("slot_index"), slotIndex)
            )
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
          participant_count: 1,
          status: "pending_terms",
          token: crypto.randomUUID(),
          class_id: row.class_id,
          source: "s3",
          unit_price: row.unit_price,
          total_price: row.total_price,
          slot_index: slotIndex,
          created_at: now,
        });

        purchaseIds.push(purchaseId);
        inserted += 1;
      }
    }

    return { rows_inserted: inserted, rows_skipped: skipped, purchase_ids: purchaseIds };
  },
});
