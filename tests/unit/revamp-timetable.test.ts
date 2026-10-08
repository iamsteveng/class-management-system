import { describe, it, expect, vi } from 'vitest';

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

import {
  cycleWeekOf,
  hkDate,
  occurrencesInWindow,
  openTimetableSessions,
  setTimetableEntryPaused,
  weekdayOf,
} from '../../convex/timetable';
import { handler, makeDb } from './helpers/fakeDb';

const ANCHOR = '2026-10-05';
const settings = { key: 'default', cycle_anchor: ANCHOR, cycle_weeks: 2, window_days: 28 };

function entry(overrides: Record<string, unknown>) {
  return {
    entry_id: 'e1',
    class_id: 'kid',
    venue_id: 'tsw',
    cycle_week: 1,
    weekday: 5,
    start_time: '10:00',
    end_time: '11:00',
    ...overrides,
  };
}

function world(entries: any[], extra: Record<string, any[]> = {}) {
  return makeDb({
    timetable_settings: [{ _id: 's', ...settings }],
    timetable_entries: entries.map((e, i) => ({ _id: `te${i}`, ...e })),
    classes: [{ _id: 'c', class_id: 'kid', class_size: 6 }],
    venues: [{ _id: 'v', venue_id: 'tsw', name_zh: '天水圍', latitude: 22.45, longitude: 114.0 }],
    sessions: [],
    admins: [
      { _id: 'a1', username: 'admin', role: 'super_admin' },
      { _id: 'a2', username: 'staff', role: 'regular_admin' },
    ],
    audit_logs: [],
    ...extra,
  });
}

describe('Timetable cycle', () => {
  it('alternates weeks from the anchor Monday', () => {
    expect(cycleWeekOf('2026-10-05', ANCHOR, 2)).toBe(1);
    expect(cycleWeekOf('2026-10-12', ANCHOR, 2)).toBe(2);
    expect(cycleWeekOf('2026-10-24', ANCHOR, 2)).toBe(1); // launch Saturday: 天水圍
    expect(cycleWeekOf('2026-10-31', ANCHOR, 2)).toBe(2); // next Saturday: 青衣
  });

  it('numbers weekdays from Monday', () => {
    expect(weekdayOf('2026-10-05')).toBe(0);
    expect(weekdayOf('2026-10-24')).toBe(5);
    expect(weekdayOf('2026-10-25')).toBe(6);
  });

  it('reads today in Hong Kong time', () => {
    expect(hkDate(Date.parse('2026-10-22T16:30:00Z'))).toBe('2026-10-23');
  });

  it('opens only the matching week and weekday, and skips what has already started today', () => {
    const entries = [entry({ entry_id: 'sat-w1' }), entry({ entry_id: 'sat-w2', cycle_week: 2 })];
    const dates = occurrencesInWindow(entries, settings, '2026-10-24', '10:30').map(
      (o) => `${o.entry.entry_id}@${o.date}`
    );
    expect(dates).toEqual(['sat-w2@2026-10-31', 'sat-w1@2026-11-07', 'sat-w2@2026-11-14']);
  });

  it('opens nothing for paused entries or a paused Timetable', () => {
    expect(occurrencesInWindow([entry({ paused: true })], settings, '2026-10-23', '00:00')).toEqual([]);
    expect(occurrencesInWindow([entry({})], { ...settings, paused: true }, '2026-10-23', '00:00')).toEqual([]);
  });
});

describe('openTimetableSessions', () => {
  const now = Date.parse('2026-10-22T16:05:00Z'); // 00:05 on Fri 23 Oct in Hong Kong

  it('opens Sessions at the Venue with Quota = Class Size, and is idempotent', async () => {
    const db = world([entry({})]);
    const opened = await openTimetableSessions({ db } as any, now);
    expect(opened).toBe(2); // Sat 24 Oct and Sat 7 Nov (week 1) within 28 days
    expect(db.tables.sessions[0]).toMatchObject({
      class_id: 'kid',
      venue_id: 'tsw',
      location_zh: '天水圍',
      date: '2026-10-24',
      time: '10:00',
      end_time: '11:00',
      quota_defined: 6,
      quota_used: 0,
      status: 'scheduled',
      timetable_entry_id: 'e1',
    });
    expect(await openTimetableSessions({ db } as any, now)).toBe(0);
    expect(db.tables.sessions).toHaveLength(2);
  });

  it('never recreates or resets a Session an admin cancelled, hid or edited', async () => {
    const db = world([entry({})], {
      sessions: [
        { _id: 'x', timetable_entry_id: 'e1', date: '2026-10-24', status: 'cancelled', quota_defined: 6 },
        { _id: 'y', timetable_entry_id: 'e1', date: '2026-11-07', status: 'scheduled', hidden: true, quota_defined: 3 },
      ],
    });
    expect(await openTimetableSessions({ db } as any, now)).toBe(0);
    expect(db.tables.sessions.map((s) => [s.status, s.hidden, s.quota_defined])).toEqual([
      ['cancelled', undefined, 6],
      ['scheduled', true, 3],
    ]);
  });

  it('does nothing without a Timetable', async () => {
    const db = world([entry({})], { timetable_settings: [] });
    expect(await openTimetableSessions({ db } as any, now)).toBe(0);
  });
});

describe('pausing', () => {
  it('lets a Super Admin pause an entry, and refuses a Regular Admin', async () => {
    const db = world([entry({})]);
    await expect(
      handler(setTimetableEntryPaused)({ db }, { entry_id: 'e1', paused: true, admin_username: 'staff' })
    ).rejects.toThrow(/super admins/);
    await handler(setTimetableEntryPaused)({ db }, { entry_id: 'e1', paused: true, admin_username: 'admin' });
    expect(db.tables.timetable_entries[0].paused).toBe(true);
    expect(await openTimetableSessions({ db } as any, Date.parse('2026-10-22T16:05:00Z'))).toBe(0);
  });
});
