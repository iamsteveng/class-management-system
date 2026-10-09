import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

vi.mock('convex/server', () => ({
  queryGeneric: (def: any) => def,
  mutationGeneric: (def: any) => def,
  actionGeneric: (def: any) => def,
  internalQueryGeneric: (def: any) => def,
  internalMutationGeneric: (def: any) => def,
  internalActionGeneric: (def: any) => def,
  makeFunctionReference: (name: string) => name,
}));
vi.mock('convex/values', () => {
  const noop = (..._args: any[]): any => 'schema';
  return { v: new Proxy({} as any, { get: () => noop }) };
});

import { canSelfChange, changeCutoffAt } from '../../convex/changeCutoff';
import { changeParticipantSession as selfChange } from '../../convex/participants';
import { changeParticipantSession as adminChange, getParticipantHistory } from '../../convex/adminParticipants';
import { handler, makeDb } from './helpers/fakeDb';

// Saturday 24 Oct 2026; its Change Cutoff is Thursday 22 Oct 00:00 HKT = 21 Oct 16:00 UTC.
const CUTOFF = Date.parse('2026-10-21T16:00:00Z');

describe('Change Cutoff', () => {
  it('is 00:00 Hong Kong time two days before the Session', () => {
    expect(changeCutoffAt('2026-10-24')).toBe(CUTOFF);
  });

  it('lets Participants change until just before it, not after', () => {
    expect(canSelfChange({ date: '2026-10-24' }, CUTOFF - 1)).toBe(true);
    expect(canSelfChange({ date: '2026-10-24' }, CUTOFF)).toBe(false);
  });

  it('is lifted when the Session is rain-cancelled', () => {
    expect(canSelfChange({ date: '2026-10-24', cancellation_reason: 'rain' }, CUTOFF + 86_400_000)).toBe(true);
  });
});

function world(overrides: { current?: Record<string, unknown>; target?: Record<string, unknown> } = {}) {
  const scheduler = { runAfter: vi.fn() };
  const db = makeDb({
    admins: [
      { _id: 'a1', username: 'admin', role: 'super_admin' },
      { _id: 'a2', username: 'staff', role: 'regular_admin' },
    ],
    participants: [{ _id: 'p', participant_id: 'pid', purchase_id: 'pur', session_id: 'sat', mobile: '+85291234567' }],
    purchases: [{ _id: 'pur', customer_mobile: '+85291234567' }],
    sessions: [
      { _id: 's1', session_id: 'sat', class_id: 'c', date: '2026-10-24', time: '10:00', status: 'scheduled', quota_defined: 6, quota_used: 1, location_zh: '天水圍', ...overrides.current },
      { _id: 's2', session_id: 'next', class_id: 'c', date: '2026-10-31', time: '10:00', status: 'scheduled', quota_defined: 6, quota_used: 0, location_zh: '青衣', ...overrides.target },
    ],
    seat_holds: [],
    attendance_records: [],
    audit_logs: [],
  });
  return { ctx: { db, scheduler }, db };
}

const move = (ctx: any, extra: Record<string, unknown> = {}) =>
  handler(adminChange)(ctx, { participant_id: 'pid', session_id: 'next', admin_username: 'admin', ...extra });

beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());

describe('moving a Participant', () => {
  it('lets the Participant move themselves before the cutoff', async () => {
    vi.setSystemTime(CUTOFF - 60_000);
    const { ctx, db } = world();
    expect(await handler(selfChange)(ctx, { participant_id: 'pid', session_id: 'next' })).toEqual({ success: true });
    expect(db.tables.participants[0].session_id).toBe('next');
  });

  it('refuses the Participant past the cutoff', async () => {
    vi.setSystemTime(CUTOFF + 60_000);
    const { ctx } = world();
    const result = await handler(selfChange)(ctx, { participant_id: 'pid', session_id: 'next' });
    expect(result.success).toBe(false);
    expect(result.error_message).toMatch(/00:00 two days before/);
  });

  it('lets a Super Admin move them past the cutoff only with a reason, which is audited', async () => {
    vi.setSystemTime(CUTOFF + 60_000);
    const { ctx, db } = world();
    expect((await move(ctx)).success).toBe(false);
    expect((await move(ctx, { reason: 'ok' })).success).toBe(false); // too short
    expect(await move(ctx, { reason: 'Left sick, rebooked' })).toEqual({ success: true });
    const log = db.tables.audit_logs.find((l: any) => l.action === 'participant_session_changed');
    expect(log).toMatchObject({ admin_id: 'a1', metadata: { past_cutoff: true, override_reason: 'Left sick, rebooked' } });
  });

  it('needs no reason before the cutoff', async () => {
    vi.setSystemTime(CUTOFF - 60_000);
    const { ctx } = world();
    expect(await move(ctx)).toEqual({ success: true });
  });

  it('refuses a Regular Admin', async () => {
    vi.setSystemTime(CUTOFF + 60_000);
    const { ctx } = world();
    expect((await move(ctx, { admin_username: 'staff', reason: 'Left sick, rebooked' })).success).toBe(false);
  });

  it('moves someone whose Session has passed, even after they were scanned', async () => {
    vi.setSystemTime(Date.parse('2026-10-24T05:00:00Z')); // Saturday 13:00 HKT, class at 10:00 is over
    const { ctx, db } = world();
    db.tables.attendance_records.push({ _id: 'r', participant_id: 'pid', session_id: 'sat', marked_by_admin: 'a2', marked_at: Date.parse('2026-10-24T02:05:00Z') });
    expect(await move(ctx, { reason: 'Left sick part-way' })).toEqual({ success: true });
    expect(db.tables.participants[0].session_id).toBe('next');
    expect(db.tables.attendance_records).toHaveLength(1); // the Scan stays as evidence

    const history = await handler(getParticipantHistory)(ctx, { participant_id: 'pid' });
    expect(history.map((h: any) => h.kind)).toEqual(['scan', 'move']);
    expect(history[0]).toMatchObject({ admin_username: 'staff', session_label: '2026-10-24 10:00 天水圍' });
    expect(history[1]).toMatchObject({ admin_username: 'admin', to_session_label: '2026-10-31 10:00 青衣', past_cutoff: true, reason: 'Left sick part-way' });
  });

  it('never moves anyone into a Session that has started, is cancelled or is full', async () => {
    vi.setSystemTime(CUTOFF + 60_000);
    for (const target of [
      { date: '2026-10-21', time: '10:00' }, // already started
      { status: 'cancelled' },
      { status: 'completed' },
      { quota_used: 6 }, // full
    ]) {
      const { ctx } = world({ target });
      expect((await move(ctx, { reason: 'Left sick, rebooked' })).success, JSON.stringify(target)).toBe(false);
    }
  });
});
