import { mutationGeneric, queryGeneric } from "convex/server";
import { v } from "convex/values";

export const getCurrentTermsVersion = queryGeneric({
  args: {},
  returns: v.union(
    v.null(),
    v.object({
      version: v.string(),
      content: v.string(),
      created_at: v.number(),
    })
  ),
  handler: async (ctx) => {
    const current = await ctx.db
      .query("terms_versions")
      .withIndex("by_is_current", (q) => q.eq("is_current", true))
      .first();

    if (!current) {
      return null;
    }

    return {
      version: current.version,
      content: current.content,
      created_at: current.created_at,
    };
  },
});

export const createTermsVersion = mutationGeneric({
  args: {
    version: v.string(),
    content: v.string(),
    admin_username: v.string(),
  },
  returns: v.object({ version: v.string() }),
  handler: async (ctx, args) => {
    const admin = await ctx.db
      .query("admins")
      .withIndex("by_username", (q) => q.eq("username", args.admin_username))
      .first();

    if (!admin || admin.role !== "super_admin") {
      throw new Error("Only super admins can create new terms versions.");
    }

    const now = Date.now();

    // Deactivate all existing current versions
    const currentVersions = await ctx.db
      .query("terms_versions")
      .withIndex("by_is_current", (q) => q.eq("is_current", true))
      .collect();

    for (const tv of currentVersions) {
      await ctx.db.patch(tv._id, { is_current: false });
    }

    const version = args.version.trim();
    const content = args.content.trim();

    await ctx.db.insert("terms_versions", {
      version,
      content,
      is_current: true,
      created_at: now,
    });

    await ctx.db.insert("audit_logs", {
      admin_id: admin._id,
      action: "terms_version_created",
      entity_type: "terms_versions",
      entity_id: version,
      metadata: { version, admin_username: args.admin_username },
      created_at: now,
    });

    return { version };
  },
});
