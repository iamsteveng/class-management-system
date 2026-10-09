import { describe, it, expect, vi } from 'vitest';

vi.mock('convex/server', () => ({
  actionGeneric: (def: any) => def,
  internalQueryGeneric: (def: any) => def,
  internalActionGeneric: (def: any) => def,
  queryGeneric: (def: any) => def,
  mutationGeneric: (def: any) => def,
  internalMutationGeneric: (def: any) => def,
  makeFunctionReference: (name: string) => name,
}));
vi.mock('convex/values', () => {
  const noop = (..._args: any[]): any => 'schema';
  return { v: new Proxy({} as any, { get: () => noop }) };
});

import { CLASSES, TIMETABLE, VENUES, seed } from '../../convex/revampCatalogue';
import { handler, makeDb } from './helpers/fakeDb';

const emptyWorld = () =>
  makeDb({ classes: [], venues: [], timetable_entries: [], timetable_settings: [], sessions: [] });

describe('revamp catalogue data', () => {
  it('has 40 Timetable entries per two-week cycle, Wednesday to Sunday', () => {
    expect(TIMETABLE).toHaveLength(40);
    expect(new Set(TIMETABLE.map((e) => e.entry_id)).size).toBe(40);
    expect(TIMETABLE.every((e) => e.weekday >= 2)).toBe(true);
  });

  it('runs weekends only at Tin Shui Wai and Tsing Yi', () => {
    const weekendVenues = new Set(TIMETABLE.filter((e) => e.weekday >= 5).map((e) => e.venue_id));
    expect(weekendVenues).toEqual(new Set(['venue_tsw', 'venue_ty']));
  });

  it('only refers to Classes and Venues it defines', () => {
    const classIds = new Set(CLASSES.map((c) => c.class_id));
    const venueIds = new Set(VENUES.map((v) => v.venue_id));
    expect(TIMETABLE.every((e) => classIds.has(e.class_id) && venueIds.has(e.venue_id))).toBe(true);
  });
});

describe('seed', () => {
  it('loads everything and opens the launch window as if it were 23 Oct 2026', async () => {
    const db = emptyWorld();
    const result = await handler(seed)({ db }, { today: '2026-10-23' });
    expect(result).toMatchObject({ classes: 2, venues: 5, timetable_entries: 40 });
    expect(result.sessions_opened).toBeGreaterThan(70);

    const on = (date: string) =>
      new Set(db.tables.sessions.filter((s) => s.date === date).map((s) => s.location_zh));
    expect(on('2026-10-23')).toEqual(new Set(['九龍城樂區單車亭']));
    expect(on('2026-10-24')).toEqual(new Set(['天水圍樂區單車亭']));
    expect(on('2026-10-25')).toEqual(new Set(['青衣樂區單車亭']));
    expect(on('2026-10-31')).toEqual(new Set(['青衣樂區單車亭']));
    expect(on('2026-10-26')).toEqual(new Set()); // Monday

    const kids = db.tables.sessions.find((s) => s.class_id === 'class_cycling_kids');
    expect(kids.quota_defined).toBe(6);
    const regular = db.tables.sessions.find((s) => s.class_id === 'class_cycling_regular');
    expect(regular.quota_defined).toBe(8);
  });

  it('running it twice changes nothing', async () => {
    const db = emptyWorld();
    await handler(seed)({ db }, { today: '2026-10-23' });
    const counts = () => Object.fromEntries(Object.entries(db.tables).map(([k, rows]) => [k, rows.length]));
    const before = counts();
    const again = await handler(seed)({ db }, { today: '2026-10-23' });
    expect(again.sessions_opened).toBe(0);
    expect(counts()).toEqual(before);
  });

  it('keeps an admin-set Class status and Timetable pause', async () => {
    const db = emptyWorld();
    await handler(seed)({ db }, { today: '2026-10-23' });
    db.tables.classes[0].status = 'inactive';
    db.tables.timetable_entries[0].paused = true;
    db.tables.timetable_settings[0].paused = true;
    await handler(seed)({ db }, { today: '2026-10-23' });
    expect(db.tables.classes[0].status).toBe('inactive');
    expect(db.tables.timetable_entries[0].paused).toBe(true);
    expect(db.tables.timetable_settings[0].paused).toBe(true);
  });

  it('removes Timetable entries that are no longer in the data, leaving their Sessions', async () => {
    const db = emptyWorld();
    db.tables.timetable_entries.push({ _id: 'old', entry_id: 'retired-entry' });
    db.tables.sessions.push({ _id: 'old-s', timetable_entry_id: 'retired-entry', date: '2026-10-24' });
    await handler(seed)({ db }, { today: '2026-10-23' });
    expect(db.tables.timetable_entries.some((e) => e.entry_id === 'retired-entry')).toBe(false);
    expect(db.tables.sessions.some((s) => s._id === 'old-s')).toBe(true);
  });
});
