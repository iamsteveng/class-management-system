import {
  makeFunctionReference,
  mutationGeneric,
  queryGeneric,
  type GenericMutationCtx,
} from "convex/server";
import { v } from "convex/values";

import {
  unitPriceFor,
  validateCheckout,
  type ParticipantInput,
} from "../lib/checkoutRules";
import { normalizeToE164 } from "../lib/phone";
import type { DataModel, Doc } from "./_generated/dataModel";
import { remainingQuota } from "./remainingQuota";
import { hkDate, hkTime } from "./timetable";

/**
 * Checkout for the new apply flow: the Customer picks a Session, names everyone and
 * accepts the terms on their behalf, then pays. A Seat Hold keeps their seats while they
 * pay; when payment succeeds the Order's Tickets and Participants are created together.
 *
 * These functions are called only by the Next.js payment routes, which hold the Airwallex
 * credentials and verify payments. They require the shared server secret so nobody can
 * call them directly to take seats without paying.
 */

export const SEAT_HOLD_MINUTES = 15;
const FREE_LIMIT_PER_HOUR = 30;

const participantInputValidator = v.object({
  name: v.string(),
  age: v.number(),
  height: v.number(),
  riding_experience: v.union(
    v.literal("never"),
    v.literal("training_wheels"),
    v.literal("short_distance")
  ),
  mobile: v.string(),
  emergency_contact_name: v.string(),
  emergency_contact_phone: v.string(),
  health_notes: v.optional(v.string()),
  photo_consent: v.boolean(),
});

/** Refuses the call unless it carries the server secret shared with the Next.js app. */
export function assertServerSecret(secret: string) {
  const expected = process.env.CHECKOUT_SERVER_SECRET;
  if (!expected || secret !== expected) {
    throw new Error("Not allowed.");
  }
}

type MutationCtx = GenericMutationCtx<DataModel>;

async function getSession(ctx: MutationCtx, sessionId: string) {
  return ctx.db
    .query("sessions")
    .withIndex("by_session_id", (q) => q.eq("session_id", sessionId))
    .first();
}

async function getClass(ctx: MutationCtx, classId: string) {
  return ctx.db
    .query("classes")
    .withIndex("by_class_id", (q) => q.eq("class_id", classId))
    .first();
}

function isOnSale(cls: Doc<"classes">) {
  return cls.status === "active" && (typeof cls.airwallex_price === "number" || cls.is_free === true);
}

function hasStarted(session: { date: string; time: string }, now: number) {
  const today = hkDate(now);
  return session.date < today || (session.date === today && session.time <= hkTime(now));
}

function normalizeParticipant(p: ParticipantInput) {
  return {
    name: p.name.trim(),
    age: p.age,
    height: p.height,
    riding_experience: p.riding_experience,
    mobile: normalizeToE164(p.mobile) ?? p.mobile.trim(),
    emergency_contact_name: p.emergency_contact_name.trim(),
    emergency_contact_phone: normalizeToE164(p.emergency_contact_phone) ?? p.emergency_contact_phone.trim(),
    health_notes: p.health_notes?.trim() || undefined,
    photo_consent: p.photo_consent,
  };
}

/**
 * Creates the Order for a Seat Hold: one Ticket per person, bound to the Session, with
 * its Participant already named and their Terms Acceptance given by the Customer.
 */
async function seatOrder(
  ctx: MutationCtx,
  hold: Doc<"seat_holds">,
  session: Doc<"sessions">,
  orderId: string,
  source: "airwallex" | "free",
  now: number
): Promise<string[]> {
  const participantIds: string[] = [];

  for (let i = 0; i < hold.participants.length; i++) {
    const person = hold.participants[i];
    const purchaseId = await ctx.db.insert("purchases", {
      order_id: orderId,
      customer_mobile: hold.customer_mobile,
      purchase_datetime: new Date(now).toISOString(),
      participant_count: 1,
      status: "terms_accepted",
      token: crypto.randomUUID(),
      class_id: hold.class_id,
      session_id: hold.session_id,
      source,
      unit_price: hold.unit_price,
      total_price: hold.unit_price,
      currency: hold.currency,
      slot_index: i,
      created_at: now,
    });

    const participantId = crypto.randomUUID();
    participantIds.push(participantId);
    await ctx.db.insert("participants", {
      participant_id: participantId,
      purchase_id: purchaseId,
      session_id: hold.session_id,
      name: person.name,
      mobile: person.mobile,
      qr_code_data: participantId,
      terms_accepted_at: now,
      terms_version_id: hold.terms_version_id,
      terms_accepted_by: "customer",
      height: person.height,
      age: person.age,
      emergency_contact_name: person.emergency_contact_name,
      emergency_contact_phone: person.emergency_contact_phone,
      riding_experience: person.riding_experience,
      health_notes: person.health_notes,
      photo_consent: person.photo_consent,
      created_at: now,
    });
  }

  await ctx.db.patch(session._id, { quota_used: session.quota_used + hold.quantity });
  await ctx.db.patch(hold._id, {
    status: "completed",
    order_id: orderId,
    participant_ids: participantIds,
    completed_at: now,
  });

  const cls = await getClass(ctx, hold.class_id);
  for (const person of hold.participants) {
    await ctx.scheduler.runAfter(
      0,
      makeFunctionReference<"action">("slackNotifications:notifyTermsAccepted"),
      {
        class_name_zh: cls?.name_zh ?? "",
        session_date: session.date,
        session_time: session.time,
        session_location_zh: session.location_zh ?? "",
        participant_name: person.name,
      }
    );
  }

  await ctx.db.insert("audit_logs", {
    action: "order_paid",
    entity_type: "purchase",
    entity_id: orderId,
    metadata: {
      hold_id: hold.hold_id,
      session_id: hold.session_id,
      class_id: hold.class_id,
      quantity: hold.quantity,
      total_price: hold.total_price,
      participant_ids: participantIds,
      terms_accepted_by: "customer",
    },
    created_at: now,
  });

  return participantIds;
}

const startCheckoutResult = v.union(
  v.object({
    kind: v.literal("held"),
    hold_id: v.string(),
    amount: v.number(),
    currency: v.string(),
    expires_at: v.number(),
  }),
  v.object({
    kind: v.literal("completed"),
    hold_id: v.string(),
    order_id: v.string(),
    participant_ids: v.array(v.string()),
  }),
  v.object({
    kind: v.literal("error"),
    code: v.string(),
    message: v.string(),
    index: v.optional(v.number()),
  })
);

/**
 * Starts a Customer's checkout: checks everything they entered, then holds their seats
 * for SEAT_HOLD_MINUTES. A free Class needs no payment, so its Order is created at once.
 * Repeating the same request_id returns the same hold.
 */
export const startCheckout = mutationGeneric({
  args: {
    server_secret: v.string(),
    request_id: v.string(),
    class_id: v.string(),
    session_id: v.string(),
    customer_mobile: v.string(),
    participants: v.array(participantInputValidator),
    terms_accepted: v.boolean(),
  },
  returns: startCheckoutResult,
  handler: async (ctx, args) => {
    assertServerSecret(args.server_secret);
    const now = Date.now();
    const fail = (code: string, message: string, index?: number) =>
      ({ kind: "error" as const, code, message, ...(index === undefined ? {} : { index }) });

    const previous = await ctx.db
      .query("seat_holds")
      .withIndex("by_request_id", (q) => q.eq("request_id", args.request_id))
      .first();
    if (previous) {
      if (previous.status === "completed") {
        return {
          kind: "completed" as const,
          hold_id: previous.hold_id,
          order_id: previous.order_id ?? "",
          participant_ids: previous.participant_ids ?? [],
        };
      }
      if (previous.status === "held" && previous.expires_at > now) {
        return {
          kind: "held" as const,
          hold_id: previous.hold_id,
          amount: previous.total_price,
          currency: previous.currency,
          expires_at: previous.expires_at,
        };
      }
      return fail("expired", "This checkout has expired. Please start again.");
    }

    if (!args.terms_accepted) {
      return fail("terms", "Please accept the terms on behalf of everyone you are booking for.");
    }
    if (args.participants.length < 1) {
      return fail("quantity", "Please add at least one participant.");
    }

    const cls = await getClass(ctx, args.class_id);
    if (!cls || !isOnSale(cls)) {
      return fail("class", "This class is not on sale.");
    }

    const session = await getSession(ctx, args.session_id);
    if (
      !session ||
      session.class_id !== cls.class_id ||
      session.status !== "scheduled" ||
      session.hidden === true ||
      hasStarted(session, now)
    ) {
      return fail("session", "This session is no longer available. Please pick another.");
    }

    const errors = validateCheckout(args.customer_mobile, args.participants, cls);
    if (errors.length > 0) {
      return fail(errors[0].code, errors[0].message, errors[0].index);
    }

    const quantity = args.participants.length;
    if ((await remainingQuota(ctx.db, session, { now })) < quantity) {
      return fail("full", "Not enough seats left in this session. Please pick another or book fewer people.");
    }

    const terms = await ctx.db
      .query("terms_versions")
      .withIndex("by_is_current", (q) => q.eq("is_current", true))
      .first();
    if (!terms) {
      return fail("terms", "Booking is temporarily unavailable. Please try again later.");
    }

    const customerMobile = normalizeToE164(args.customer_mobile) ?? args.customer_mobile.trim();
    const isFree = cls.is_free === true;

    if (isFree) {
      const recent = await ctx.db
        .query("purchases")
        .withIndex("by_mobile", (q) => q.eq("customer_mobile", customerMobile))
        .collect();
      const recentFree = recent.filter(
        (p) => p.source === "free" && p.class_id === cls.class_id && p.created_at >= now - 60 * 60 * 1000
      ).length;
      if (recentFree + quantity > FREE_LIMIT_PER_HOUR) {
        return fail("rate_limited", "Too many free registrations for this number. Please try again later.");
      }
    }

    const unitPrice = unitPriceFor(cls, quantity);
    const holdId = crypto.randomUUID();
    const holdDocId = await ctx.db.insert("seat_holds", {
      hold_id: holdId,
      request_id: args.request_id,
      class_id: cls.class_id,
      session_id: session.session_id,
      quantity,
      customer_mobile: customerMobile,
      participants: args.participants.map(normalizeParticipant),
      terms_version_id: terms._id,
      unit_price: unitPrice,
      total_price: unitPrice * quantity,
      currency: cls.airwallex_currency ?? "HKD",
      is_free: isFree,
      status: "held",
      expires_at: now + SEAT_HOLD_MINUTES * 60 * 1000,
      created_at: now,
    });

    if (isFree) {
      const hold = (await ctx.db.get(holdDocId))!;
      const orderId = `free_${args.request_id}`;
      const participantIds = await seatOrder(ctx, hold, session, orderId, "free", now);
      return { kind: "completed" as const, hold_id: holdId, order_id: orderId, participant_ids: participantIds };
    }

    return {
      kind: "held" as const,
      hold_id: holdId,
      amount: unitPrice * quantity,
      currency: cls.airwallex_currency ?? "HKD",
      expires_at: now + SEAT_HOLD_MINUTES * 60 * 1000,
    };
  },
});

/** Records which Airwallex payment intent is paying for a Seat Hold. */
export const attachPaymentIntent = mutationGeneric({
  args: { server_secret: v.string(), hold_id: v.string(), intent_id: v.string() },
  returns: v.null(),
  handler: async (ctx, args) => {
    assertServerSecret(args.server_secret);
    const hold = await ctx.db
      .query("seat_holds")
      .withIndex("by_hold_id", (q) => q.eq("hold_id", args.hold_id))
      .first();
    if (!hold) throw new Error("Seat hold not found.");
    await ctx.db.patch(hold._id, { intent_id: args.intent_id });
    return null;
  },
});

/** Gives up a Seat Hold the Customer will not pay for, so its seats are free again at once. */
export const releaseSeatHold = mutationGeneric({
  args: { server_secret: v.string(), hold_id: v.string() },
  returns: v.null(),
  handler: async (ctx, args) => {
    assertServerSecret(args.server_secret);
    const hold = await ctx.db
      .query("seat_holds")
      .withIndex("by_hold_id", (q) => q.eq("hold_id", args.hold_id))
      .first();
    if (hold && hold.status === "held") {
      await ctx.db.patch(hold._id, { status: "released" });
    }
    return null;
  },
});

const completeResult = v.union(
  v.object({
    outcome: v.literal("seated"),
    order_id: v.string(),
    participant_ids: v.array(v.string()),
  }),
  // Paid after the hold lapsed and the Session no longer has room for everyone:
  // the caller must refund the whole payment, then call recordCheckoutRefund.
  v.object({
    outcome: v.literal("refund_needed"),
    intent_id: v.string(),
    amount: v.number(),
    currency: v.string(),
  }),
  // Another call already handled this payment's refund.
  v.object({
    outcome: v.literal("refunded"),
    status: v.string(),
  })
);

/**
 * Turns a paid Seat Hold into its Order. Called once the payment has been verified as
 * succeeded; safe to call more than once for the same payment.
 *
 * A payment that arrives after its hold lapsed still gets its Tickets if the Session has
 * room for all of them; otherwise the whole Order is refunded, never split.
 */
export const completeCheckout = mutationGeneric({
  args: {
    server_secret: v.string(),
    hold_id: v.string(),
    intent_id: v.string(),
    amount: v.number(),
    currency: v.string(),
  },
  returns: completeResult,
  handler: async (ctx, args) => {
    assertServerSecret(args.server_secret);
    const now = Date.now();
    const hold = await ctx.db
      .query("seat_holds")
      .withIndex("by_hold_id", (q) => q.eq("hold_id", args.hold_id))
      .first();
    if (!hold) throw new Error("Seat hold not found.");

    if (hold.status === "completed") {
      return {
        outcome: "seated" as const,
        order_id: hold.order_id ?? args.intent_id,
        participant_ids: hold.participant_ids ?? [],
      };
    }
    if (hold.status === "refund_pending" || hold.status === "refunded" || hold.status === "refund_failed") {
      return { outcome: "refunded" as const, status: hold.status };
    }
    if (hold.intent_id && hold.intent_id !== args.intent_id) {
      throw new Error("Payment does not belong to this seat hold.");
    }
    if (args.amount !== hold.total_price || args.currency !== hold.currency) {
      throw new Error("Payment amount does not match the seat hold.");
    }

    const session = await getSession(ctx, hold.session_id);
    const stillHeld = hold.status === "held" && hold.expires_at > now;
    const roomForAll =
      !!session &&
      session.status === "scheduled" &&
      (await remainingQuota(ctx.db, session, { now, excludeHoldId: hold.hold_id })) >= hold.quantity;

    if (session && (stillHeld || roomForAll)) {
      const participantIds = await seatOrder(ctx, hold, session, args.intent_id, "airwallex", now);
      return { outcome: "seated" as const, order_id: args.intent_id, participant_ids: participantIds };
    }

    await ctx.db.patch(hold._id, { status: "refund_pending", intent_id: args.intent_id });
    await ctx.db.insert("audit_logs", {
      action: "late_payment_refund_started",
      entity_type: "seat_hold",
      entity_id: hold.hold_id,
      metadata: { intent_id: args.intent_id, session_id: hold.session_id, quantity: hold.quantity },
      created_at: now,
    });
    return {
      outcome: "refund_needed" as const,
      intent_id: args.intent_id,
      amount: hold.total_price,
      currency: hold.currency,
    };
  },
});

/** Records the outcome of refunding a late payment and alerts staff on Slack. */
export const recordCheckoutRefund = mutationGeneric({
  args: {
    server_secret: v.string(),
    hold_id: v.string(),
    refund_id: v.optional(v.string()),
    error: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    assertServerSecret(args.server_secret);
    const hold = await ctx.db
      .query("seat_holds")
      .withIndex("by_hold_id", (q) => q.eq("hold_id", args.hold_id))
      .first();
    if (!hold || hold.status !== "refund_pending") return null;

    const refunded = !!args.refund_id && !args.error;
    await ctx.db.patch(hold._id, {
      status: refunded ? "refunded" : "refund_failed",
      refund_id: args.refund_id,
    });

    const session = await getSession(ctx, hold.session_id);
    await ctx.scheduler.runAfter(
      0,
      makeFunctionReference<"action">("slackNotifications:notifyLatePaymentRefund"),
      {
        refunded,
        customer_mobile: hold.customer_mobile,
        session_date: session?.date ?? "",
        session_time: session?.time ?? "",
        session_location_zh: session?.location_zh ?? "",
        quantity: hold.quantity,
        amount: hold.total_price,
        currency: hold.currency,
        intent_id: hold.intent_id ?? "",
        error: args.error,
      }
    );

    await ctx.db.insert("audit_logs", {
      action: refunded ? "late_payment_refunded" : "late_payment_refund_failed",
      entity_type: "seat_hold",
      entity_id: hold.hold_id,
      metadata: { intent_id: hold.intent_id, refund_id: args.refund_id, error: args.error },
      created_at: Date.now(),
    });
    return null;
  },
});

/** What the success screen needs once a checkout is done; keyed by the unguessable hold_id. */
export const getCheckoutResult = queryGeneric({
  args: { hold_id: v.string() },
  returns: v.union(
    v.null(),
    v.object({
      status: v.string(),
      participant_ids: v.array(v.string()),
      session_id: v.string(),
      class_id: v.string(),
      quantity: v.number(),
    })
  ),
  handler: async (ctx, args) => {
    const hold = await ctx.db
      .query("seat_holds")
      .withIndex("by_hold_id", (q) => q.eq("hold_id", args.hold_id))
      .first();
    if (!hold) return null;
    return {
      status: hold.status,
      participant_ids: hold.participant_ids ?? [],
      session_id: hold.session_id,
      class_id: hold.class_id,
      quantity: hold.quantity,
    };
  },
});
