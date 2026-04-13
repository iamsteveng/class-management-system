import { queryGeneric } from "convex/server";
import { v } from "convex/values";

export const listRecentIngestionRuns = queryGeneric({
  args: {},
  returns: v.array(
    v.object({
      _id: v.id("ingestion_runs"),
      run_at: v.number(),
      status: v.union(
        v.literal("success"),
        v.literal("partial"),
        v.literal("error")
      ),
      files_processed: v.number(),
      rows_inserted: v.number(),
      rows_skipped: v.number(),
      error_message: v.optional(v.string()),
    })
  ),
  handler: async (ctx) => {
    const runs = await ctx.db
      .query("ingestion_runs")
      .withIndex("by_run_at")
      .order("desc")
      .take(20);
    return runs.map((run) => ({
      _id: run._id,
      run_at: run.run_at,
      status: run.status,
      files_processed: run.files_processed,
      rows_inserted: run.rows_inserted,
      rows_skipped: run.rows_skipped,
      error_message: run.error_message,
    }));
  },
});
