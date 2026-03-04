import { mutationGeneric, queryGeneric } from "convex/server";
import { v } from "convex/values";

export const getTermsPageData = queryGeneric({
  args: {
    token: v.string(),
  },
  returns: v.union(
    v.null(),
    v.object({
      customer_mobile: v.string(),
      participant_count: v.number(),
      purchase_status: v.union(
        v.literal("pending_terms"),
        v.literal("confirmation_sent"),
        v.literal("terms_accepted"),
        v.literal("cancelled")
      ),
      class_name: v.optional(v.string()),
      terms_version: v.string(),
      terms_content: v.string(),
      sessions: v.array(
        v.object({
          session_id: v.string(),
          class_id: v.string(),
          class_name: v.string(),
          location: v.string(),
          date: v.string(),
          time: v.string(),
          available_quota: v.number(),
        })
      ),
    })
  ),
  handler: async (ctx, args) => {
    const purchase = await ctx.db
      .query("purchases")
      .withIndex("by_token", (q) => q.eq("token", args.token))
      .first();

    if (!purchase || purchase.status === "cancelled") {
      return null;
    }

    const currentTerms = await ctx.db
      .query("terms_versions")
      .withIndex("by_is_current", (q) => q.eq("is_current", true))
      .first();

    if (!currentTerms) {
      return null;
    }

    const classDocs = new Map<string, string>();
    if (purchase.class_id) {
      const purchaseClass = await ctx.db
        .query("classes")
        .withIndex("by_class_id", (q) => q.eq("class_id", purchase.class_id!))
        .first();
      if (purchaseClass) {
        classDocs.set(purchaseClass.class_id, purchaseClass.name);
      }
    }

    const rawSessions = purchase.class_id
      ? await ctx.db
          .query("sessions")
          .withIndex("by_class_id", (q) => q.eq("class_id", purchase.class_id!))
          .collect()
      : await ctx.db.query("sessions").collect();

    const classIds = new Set(rawSessions.map((session) => session.class_id));
    for (const classId of classIds) {
      if (!classDocs.has(classId)) {
        const classRecord = await ctx.db
          .query("classes")
          .withIndex("by_class_id", (q) => q.eq("class_id", classId))
          .first();
        if (classRecord) {
          classDocs.set(classId, classRecord.name);
        }
      }
    }

    const sessions = rawSessions
      .filter((session) => session.status === "scheduled")
      .map((session) => {
        const availableQuota = Math.max(
          session.quota_defined - session.quota_used,
          0
        );
        return {
          session_id: session.session_id,
          class_id: session.class_id,
          class_name: classDocs.get(session.class_id) ?? "Unknown class",
          location: session.location,
          date: session.date,
          time: session.time,
          available_quota: availableQuota,
        };
      })
      .filter((session) => session.available_quota > 0)
      .sort((left, right) => {
        const leftDateTime = `${left.date}T${left.time}`;
        const rightDateTime = `${right.date}T${right.time}`;
        return leftDateTime.localeCompare(rightDateTime);
      });

    return {
      customer_mobile: purchase.customer_mobile,
      participant_count: purchase.participant_count,
      purchase_status: purchase.status,
      class_name: purchase.class_id
        ? (classDocs.get(purchase.class_id) ?? undefined)
        : undefined,
      terms_version: currentTerms.version,
      terms_content: currentTerms.content,
      sessions,
    };
  },
});

export const acceptTermsByToken = mutationGeneric({
  args: {
    token: v.string(),
    session_id: v.string(),
    accepted: v.boolean(),
  },
  returns: v.object({
    success: v.boolean(),
    error_message: v.optional(v.string()),
  }),
  handler: async (ctx, args) => {
    if (!args.accepted) {
      return {
        success: false,
        error_message: "Please accept the terms before submitting.",
      };
    }

    const purchase = await ctx.db
      .query("purchases")
      .withIndex("by_token", (q) => q.eq("token", args.token))
      .first();

    if (!purchase) {
      return {
        success: false,
        error_message: "Purchase token is invalid.",
      };
    }

    if (purchase.status === "terms_accepted") {
      return { success: true };
    }

    if (purchase.status === "cancelled") {
      return {
        success: false,
        error_message: "This purchase has been cancelled.",
      };
    }

    const session = await ctx.db
      .query("sessions")
      .withIndex("by_session_id", (q) => q.eq("session_id", args.session_id))
      .first();

    if (!session || session.status !== "scheduled") {
      return {
        success: false,
        error_message: "Selected session is not available.",
      };
    }

    const slotsRequired = Math.max(1, purchase.participant_count);
    const availableQuota = session.quota_defined - session.quota_used;
    if (availableQuota < slotsRequired) {
      return {
        success: false,
        error_message: "Selected session no longer has enough available quota.",
      };
    }

    const currentTerms = await ctx.db
      .query("terms_versions")
      .withIndex("by_is_current", (q) => q.eq("is_current", true))
      .first();

    if (!currentTerms) {
      return {
        success: false,
        error_message: "No active terms version is available.",
      };
    }

    await ctx.db.patch(purchase._id, {
      class_id: session.class_id,
      session_id: session.session_id,
      status: "terms_accepted",
    });

    await ctx.db.patch(session._id, {
      quota_used: session.quota_used + slotsRequired,
    });

    await ctx.db.insert("audit_logs", {
      action: "terms_accepted",
      entity_type: "purchase",
      entity_id: purchase.order_id,
      metadata: {
        token: purchase.token,
        session_id: session.session_id,
        class_id: session.class_id,
        accepted_at: Date.now(),
        terms_version: currentTerms.version,
      },
      created_at: Date.now(),
    });

    return { success: true };
  },
});
