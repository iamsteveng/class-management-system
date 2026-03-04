import bcrypt from "bcryptjs";
import { actionGeneric, queryGeneric, makeFunctionReference } from "convex/server";
import { v } from "convex/values";

const getAdminByUsernameRef = makeFunctionReference<"query">(
  "adminAuth:getAdminByUsername"
);

export const getAdminByUsername = queryGeneric({
  args: {
    username: v.string(),
  },
  returns: v.union(
    v.null(),
    v.object({
      username: v.string(),
      role: v.union(v.literal("super_admin"), v.literal("regular_admin")),
      password_hash: v.string(),
    })
  ),
  handler: async (ctx, args) => {
    const admin = await ctx.db
      .query("admins")
      .withIndex("by_username", (q) => q.eq("username", args.username))
      .first();

    if (!admin) {
      return null;
    }

    return {
      username: admin.username,
      role: admin.role,
      password_hash: admin.password_hash,
    };
  },
});

export const validateAdminCredentials = actionGeneric({
  args: {
    username: v.string(),
    password: v.string(),
  },
  returns: v.object({
    success: v.boolean(),
    username: v.optional(v.string()),
    role: v.optional(v.union(v.literal("super_admin"), v.literal("regular_admin"))),
  }),
  handler: async (ctx, args) => {
    const normalizedUsername = args.username.trim();
    if (normalizedUsername.length === 0 || args.password.length === 0) {
      return { success: false };
    }

    const admin = await ctx.runQuery(getAdminByUsernameRef, {
      username: normalizedUsername,
    });

    if (!admin) {
      return { success: false };
    }

    const passwordMatches = await bcrypt.compare(args.password, admin.password_hash);
    if (!passwordMatches) {
      return { success: false };
    }

    return {
      success: true,
      username: admin.username,
      role: admin.role,
    };
  },
});
