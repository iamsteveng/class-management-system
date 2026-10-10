import type { GenericMutationCtx } from "convex/server";

import type { DataModel } from "./_generated/dataModel";

/**
 * Makes this text the current Terms Version, unless it already is. Earlier versions are
 * kept unchanged (Terms Acceptances point at them); only which one is current moves.
 * Returns whether a new version was published.
 */
export async function publishTermsIfChanged(
  ctx: GenericMutationCtx<DataModel>,
  terms: { version: string; content: string },
  now: number
): Promise<boolean> {
  const current = await ctx.db
    .query("terms_versions")
    .withIndex("by_is_current", (q) => q.eq("is_current", true))
    .collect();
  if (current.some((t) => t.content === terms.content)) return false;

  for (const t of current) {
    await ctx.db.patch(t._id, { is_current: false });
  }
  await ctx.db.insert("terms_versions", {
    version: terms.version,
    content: terms.content,
    is_current: true,
    created_at: now,
  });
  await ctx.db.insert("audit_logs", {
    action: "terms_version_published",
    entity_type: "terms_versions",
    entity_id: terms.version,
    metadata: { source: "content/terms/cycling-waiver.md" },
    created_at: now,
  });
  return true;
}
