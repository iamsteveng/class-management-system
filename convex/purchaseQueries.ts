import { mutationGeneric, queryGeneric } from "convex/server";
import { v } from "convex/values";

export const getPurchaseForConfirmation = queryGeneric({
  args: {
    purchase_id: v.id("purchases"),
  },
  returns: v.union(
    v.null(),
    v.object({
      _id: v.id("purchases"),
      customer_mobile: v.string(),
      token: v.string(),
      status: v.union(
        v.literal("pending_terms"),
        v.literal("confirmation_sent"),
        v.literal("terms_accepted"),
        v.literal("cancelled")
      ),
    })
  ),
  handler: async (ctx, args) => {
    const purchase = await ctx.db.get(args.purchase_id);
    if (!purchase) {
      return null;
    }

    return {
      _id: purchase._id,
      customer_mobile: purchase.customer_mobile,
      token: purchase.token,
      status: purchase.status,
    };
  },
});

export const updatePurchaseStatus = mutationGeneric({
  args: {
    purchase_id: v.id("purchases"),
    status: v.union(
      v.literal("pending_terms"),
      v.literal("confirmation_sent"),
      v.literal("terms_accepted"),
      v.literal("cancelled")
    ),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await ctx.db.patch(args.purchase_id, {
      status: args.status,
    });
    return null;
  },
});
