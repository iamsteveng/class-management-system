import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

vi.mock('convex/server', () => ({
  queryGeneric: (def: any) => def,
  internalQueryGeneric: (def: any) => def,
  mutationGeneric: (def: any) => def,
  internalMutationGeneric: (def: any) => def,
  makeFunctionReference: (name: string) => name,
}));
vi.mock('convex/values', () => {
  const noop = (..._args: any[]): any => 'schema';
  return { v: new Proxy({} as any, { get: () => noop }) };
});

import {
  SEAT_HOLD_MINUTES,
  completeCheckout,
  recordCheckoutRefund,
  releaseSeatHold,
  startCheckout,
} from '../../convex/checkout';
import { remainingQuota } from '../../convex/remainingQuota';
import { handler, makeDb } from './helpers/fakeDb';

const SECRET = 'test-secret';
const NOW = Date.parse('2026-10-20T02:00:00Z'); // 10:00 HKT, Tue 20 Oct 2026

function person(overrides: Record<string, unknown> = {}) {
  return {
    name: 'Chan Siu Ming',
    age: 30,
    height: 170,
    riding_experience: 'never',
    mobile: '+85291234567',
    emergency_contact_name: 'Chan Tai Man',
    emergency_contact_phone: '+85298765432',
    photo_consent: false,
    ...overrides,
  };
}

function world(overrides: { session?: Record<string, unknown>; cls?: Record<string, unknown> } = {}) {
  const scheduler = { runAfter: vi.fn() };
  const db = makeDb({
    classes: [
      {
        _id: 'c1',
        class_id: 'regular',
        name_zh: '常規班',
        status: 'active',
        airwallex_price: 180,
        airwallex_group_price: 150,
        airwallex_group_min_qty: 2,
        airwallex_currency: 'HKD',
        age_min: 13,
        age_max: 60,
        ...overrides.cls,
      },
    ],
    sessions: [
      {
        _id: 's1',
        session_id: 'sess',
        class_id: 'regular',
        date: '2026-10-24',
        time: '14:00',
        location_zh: '天水圍樂區單車亭',
        quota_defined: 2,
        quota_used: 0,
        status: 'scheduled',
        ...overrides.session,
      },
    ],
    terms_versions: [{ _id: 't1', version: 'v1', is_current: true }],
    seat_holds: [],
    purchases: [],
    participants: [],
    audit_logs: [],
  });
  return { ctx: { db, scheduler }, db, scheduler };
}

const start = (ctx: any, overrides: Record<string, unknown> = {}) =>
  handler(startCheckout)(ctx, {
    server_secret: SECRET,
    request_id: crypto.randomUUID(),
    class_id: 'regular',
    session_id: 'sess',
    customer_mobile: '+85291234567',
    participants: [person()],
    terms_accepted: true,
    ...overrides,
  });

const complete = (ctx: any, hold: any, overrides: Record<string, unknown> = {}) =>
  handler(completeCheckout)(ctx, {
    server_secret: SECRET,
    hold_id: hold.hold_id,
    intent_id: 'int_1',
    amount: hold.amount,
    currency: 'HKD',
    ...overrides,
  });

beforeEach(() => {
  process.env.CHECKOUT_SERVER_SECRET = SECRET;
  vi.useFakeTimers();
  vi.setSystemTime(NOW);
});
afterEach(() => vi.useRealTimers());

describe('startCheckout', () => {
  it('refuses calls without the server secret', async () => {
    const { ctx } = world();
    await expect(start(ctx, { server_secret: 'nope' })).rejects.toThrow('Not allowed');
    delete process.env.CHECKOUT_SERVER_SECRET;
    await expect(start(ctx, { server_secret: '' })).rejects.toThrow('Not allowed');
  });

  it('holds the seats at the Group Price and counts them as taken', async () => {
    const { ctx, db } = world();
    const hold = await start(ctx, { participants: [person(), person({ name: 'Wong' })] });
    expect(hold).toMatchObject({ kind: 'held', amount: 300, currency: 'HKD' });
    expect(hold.expires_at).toBe(NOW + SEAT_HOLD_MINUTES * 60_000);
    expect(await remainingQuota(db as any, db.tables.sessions[0])).toBe(0);
  });

  it('gives the last seat to only one of two Customers paying at once', async () => {
    const { ctx } = world({ session: { quota_used: 1 } });
    const first = await start(ctx);
    const second = await start(ctx, { customer_mobile: '+85261111111' });
    expect(first.kind).toBe('held');
    expect(second).toMatchObject({ kind: 'error', code: 'full' });
  });

  it('frees the seat when the hold expires or is released', async () => {
    const { ctx, db } = world({ session: { quota_used: 1 } });
    const hold = await start(ctx);
    vi.setSystemTime(NOW + SEAT_HOLD_MINUTES * 60_000 + 1);
    expect(await remainingQuota(db as any, db.tables.sessions[0])).toBe(1);

    vi.setSystemTime(NOW);
    await handler(releaseSeatHold)(ctx, { server_secret: SECRET, hold_id: hold.hold_id });
    expect(await remainingQuota(db as any, db.tables.sessions[0])).toBe(1);
  });

  it('returns the same hold for a repeated request', async () => {
    const { ctx, db } = world();
    const request_id = crypto.randomUUID();
    const a = await start(ctx, { request_id });
    const b = await start(ctx, { request_id });
    expect(b.hold_id).toBe(a.hold_id);
    expect(db.tables.seat_holds).toHaveLength(1);
  });

  it('rejects an age outside the Class Age Range even if the form was bypassed', async () => {
    const { ctx } = world();
    expect(await start(ctx, { participants: [person({ age: 8 })] })).toMatchObject({
      kind: 'error',
      code: 'age_range',
      index: 0,
    });
  });

  it("rejects an adult whose emergency contact is their own phone", async () => {
    const { ctx } = world();
    const result = await start(ctx, {
      participants: [person({ emergency_contact_phone: '+85291234567' })],
    });
    expect(result).toMatchObject({ kind: 'error', code: 'emergency_contact_self' });
  });

  it('requires the terms to be accepted, and refuses Hidden or started Sessions', async () => {
    expect(await start(world().ctx, { terms_accepted: false })).toMatchObject({ code: 'terms' });
    expect(await start(world({ session: { hidden: true } }).ctx)).toMatchObject({ code: 'session' });
    expect(await start(world({ session: { date: '2026-10-20', time: '09:00' } }).ctx)).toMatchObject({
      code: 'session',
    });
  });

  it('books a free Class at once, with no payment', async () => {
    const { ctx, db } = world({ cls: { is_free: true, airwallex_price: undefined } });
    const result = await start(ctx);
    expect(result.kind).toBe('completed');
    expect(db.tables.participants).toHaveLength(1);
    expect(db.tables.purchases[0]).toMatchObject({ source: 'free', total_price: 0, session_id: 'sess' });
  });
});

describe('completeCheckout', () => {
  it('creates one Ticket and named Participant per person, accepted by the Customer', async () => {
    const { ctx, db } = world();
    const hold = await start(ctx, {
      participants: [person(), person({ name: 'Wong', riding_experience: 'short_distance', photo_consent: true })],
    });
    const result = await complete(ctx, hold);
    expect(result.outcome).toBe('seated');
    expect(result.participant_ids).toHaveLength(2);

    expect(db.tables.purchases).toHaveLength(2);
    expect(db.tables.purchases[0]).toMatchObject({
      order_id: 'int_1',
      session_id: 'sess',
      status: 'terms_accepted',
      source: 'airwallex',
      unit_price: 150,
      total_price: 150,
    });
    expect(db.tables.participants[1]).toMatchObject({
      name: 'Wong',
      session_id: 'sess',
      riding_experience: 'short_distance',
      photo_consent: true,
      terms_accepted_by: 'customer',
      terms_version_id: 't1',
    });
    expect(db.tables.sessions[0].quota_used).toBe(2);
    expect(await remainingQuota(db as any, db.tables.sessions[0])).toBe(0);
  });

  it('is safe to call twice for the same payment, and WhatsApps the Customer once', async () => {
    const { ctx, db, scheduler } = world();
    const hold = await start(ctx);
    const a = await complete(ctx, hold);
    const b = await complete(ctx, hold);
    expect(b).toEqual(a);
    expect(db.tables.participants).toHaveLength(1);
    const confirmations = scheduler.runAfter.mock.calls.filter(
      (call: unknown[]) => call[1] === 'orderConfirmation:sendOrderConfirmation'
    );
    expect(confirmations).toEqual([[0, 'orderConfirmation:sendOrderConfirmation', { hold_id: hold.hold_id }]]);
  });

  it('refuses a payment for the wrong amount', async () => {
    const { ctx } = world();
    const hold = await start(ctx);
    await expect(complete(ctx, hold, { amount: 1 })).rejects.toThrow(/amount/);
  });

  it('still seats a late payment when the Session has room for everyone', async () => {
    const { ctx, db } = world();
    const hold = await start(ctx);
    vi.setSystemTime(NOW + 20 * 60_000);
    expect((await complete(ctx, hold)).outcome).toBe('seated');
    expect(db.tables.participants).toHaveLength(1);
  });

  it('refunds the whole Order when a late payment no longer fits, never splitting it', async () => {
    const { ctx, db, scheduler } = world({ session: { quota_defined: 3 } });
    const hold = await start(ctx, { participants: [person(), person({ name: 'B' })] });
    vi.setSystemTime(NOW + 20 * 60_000);
    // Someone else takes 2 of the 3 seats after the hold lapsed: only 1 left for 2 people.
    const other = await start(ctx, { customer_mobile: '+85262222222', participants: [person(), person()] });
    await complete(ctx, other, { intent_id: 'int_other' });

    const result = await complete(ctx, hold);
    expect(result).toEqual({ outcome: 'refund_needed', intent_id: 'int_1', amount: 300, currency: 'HKD' });
    expect(db.tables.participants).toHaveLength(2); // only the other Order's

    // The webhook and the confirm route may both arrive: only one refund.
    expect((await complete(ctx, hold)).outcome).toBe('refunded');

    await handler(recordCheckoutRefund)(ctx, { server_secret: SECRET, hold_id: hold.hold_id, refund_id: 'rf_1' });
    expect(db.tables.seat_holds.find((h) => h.hold_id === hold.hold_id)).toMatchObject({
      status: 'refunded',
      refund_id: 'rf_1',
    });
    expect(scheduler.runAfter).toHaveBeenCalledWith(
      0,
      'slackNotifications:notifyLatePaymentRefund',
      expect.objectContaining({ refunded: true, quantity: 2 })
    );
  });

  it('records a refund that failed so staff can refund by hand', async () => {
    const { ctx, db } = world({ session: { quota_defined: 1 } });
    const hold = await start(ctx);
    vi.setSystemTime(NOW + 20 * 60_000);
    db.tables.sessions[0].quota_used = 1;
    await complete(ctx, hold);
    await handler(recordCheckoutRefund)(ctx, { server_secret: SECRET, hold_id: hold.hold_id, error: 'boom' });
    expect(db.tables.seat_holds[0].status).toBe('refund_failed');
  });
});
