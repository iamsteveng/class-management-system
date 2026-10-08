import { describe, it, expect, vi, afterEach } from 'vitest';

vi.mock('convex/server', () => ({
  queryGeneric: (def: any) => def,
  mutationGeneric: (def: any) => def,
  internalMutationGeneric: (def: any) => def,
  makeFunctionReference: (name: string) => name,
}));
vi.mock('convex/values', () => {
  const noop = (..._args: any[]): any => 'schema';
  return { v: new Proxy({} as any, { get: () => noop }) };
});

import { getLandingData } from '../../convex/landing';
import { handler, makeDb } from './helpers/fakeDb';

const world = () =>
  makeDb({
    timetable_settings: [{ _id: 's', key: 'default', cycle_anchor: '2026-10-05', cycle_weeks: 2, window_days: 28 }],
    timetable_entries: [
      { _id: 'e1', entry_id: 'e1', class_id: 'kids', venue_id: 'v1', cycle_week: 1, weekday: 5 },
      { _id: 'e2', entry_id: 'e2', class_id: 'kids', venue_id: 'v1', cycle_week: 2, weekday: 6 },
    ],
    classes: [
      { _id: 'c1', class_id: 'kids', name_zh: '幼兒班', status: 'active', airwallex_price: 180, age_min: 5, age_max: 12 },
      { _id: 'c2', class_id: 'tour', name_zh: '導賞團', status: 'active', airwallex_price: 100 },
    ],
    venues: [{ _id: 'v', venue_id: 'v1', name_zh: '天水圍樂區單車亭', district_zh: '天水圍', created_at: 1 }],
    sessions: [],
    seat_holds: [],
    terms_versions: [],
  });

afterEach(() => {
  delete process.env.REVAMP_HOMEPAGE;
});

describe('getLandingData', () => {
  it('is not live until REVAMP_HOMEPAGE is on', async () => {
    expect((await handler(getLandingData)({ db: world() }, {})).live).toBe(false);
    process.env.REVAMP_HOMEPAGE = 'on';
    expect((await handler(getLandingData)({ db: world() }, {})).live).toBe(true);
  });

  it('only shows Classes run from the Timetable, with the days each Venue runs', async () => {
    const data = await handler(getLandingData)({ db: world() }, {});
    expect(data.classes.map((c: any) => c.class.class_id)).toEqual(['kids']);
    expect(data.venues[0].days).toEqual([
      { cycle_week: 1, weekday: 5 },
      { cycle_week: 2, weekday: 6 },
    ]);
    expect(data.sessions_per_cycle).toBe(2);
  });
});
