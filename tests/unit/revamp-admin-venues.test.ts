import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

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

import { createVenue, updateVenue } from '../../convex/adminVenues';
import { createSession, updateSession } from '../../convex/adminSessions';
import { handler, makeDb } from './helpers/fakeDb';

const venueArgs = {
  name_zh: '青衣樂區單車亭',
  district_zh: '青衣',
  address_zh: '青衣担杆山路 10 號',
  latitude: 22.36,
  longitude: 114.1,
};

const world = () =>
  makeDb({
    admins: [
      { _id: 'a1', username: 'admin', role: 'super_admin' },
      { _id: 'a2', username: 'staff', role: 'regular_admin' },
    ],
    venues: [{ _id: 'v', venue_id: 'venue_ty', ...venueArgs, created_at: 1 }],
    sessions: [
      { _id: 's-past', session_id: 'past', venue_id: 'venue_ty', status: 'scheduled', date: '2026-10-01', location_zh: '青衣樂區單車亭' },
      { _id: 's-next', session_id: 'next', venue_id: 'venue_ty', status: 'scheduled', date: '2026-10-25', location_zh: '青衣樂區單車亭' },
      { _id: 's-cxl', session_id: 'cxl', venue_id: 'venue_ty', status: 'cancelled', date: '2026-10-26', location_zh: '青衣樂區單車亭' },
    ],
    audit_logs: [],
  });

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(Date.parse('2026-10-20T02:00:00Z'));
});
afterEach(() => vi.useRealTimers());

describe('Venue admin', () => {
  it('refuses calls that do not come from our server (ADR 0003)', async () => {
    const raw = (createVenue as any).handler;
    await expect(raw({ db: world() }, { ...venueArgs, admin_username: 'admin', server_secret: 'guess' })).rejects.toThrow('Not allowed');
  });

  it('only lets a Super Admin add a Venue, and requires its position', async () => {
    const db = world();
    await expect(handler(createVenue)({ db }, { ...venueArgs, admin_username: 'staff' })).rejects.toThrow(/super admins/);
    await expect(
      handler(createVenue)({ db }, { ...venueArgs, latitude: 200, admin_username: 'admin' })
    ).rejects.toThrow(/range/);
    const { venue_id } = await handler(createVenue)({ db }, { ...venueArgs, name_zh: ' 新單車亭 ', admin_username: 'admin' });
    expect(db.tables.venues.find((v: any) => v.venue_id === venue_id).name_zh).toBe('新單車亭');
  });

  it('renames upcoming scheduled Sessions with the Venue, leaving past and cancelled ones', async () => {
    const db = world();
    const result = await handler(updateVenue)(
      { db },
      { ...venueArgs, name_zh: '青衣東北公園單車亭', venue_id: 'venue_ty', admin_username: 'admin' }
    );
    expect(result.sessions_updated).toBe(1);
    const byId = (id: string) => db.tables.sessions.find((s: any) => s.session_id === id);
    expect(byId('next').location_zh).toBe('青衣東北公園單車亭');
    expect(byId('next').google_maps_url).toContain('22.36,114.1');
    expect(byId('past').location_zh).toBe('青衣樂區單車亭');
    expect(byId('cxl').location_zh).toBe('青衣樂區單車亭');
  });
});

describe('Sessions at a Venue', () => {
  const base = { class_id: 'c', date: '2026-11-01', time: '10:00', quota_defined: 6, admin_username: 'admin' };

  it('takes the location from the Venue when one is picked', async () => {
    const db = world();
    const { session_id } = await handler(createSession)({ db }, { ...base, location_zh: '', venue_id: 'venue_ty' });
    const created = db.tables.sessions.find((s: any) => s.session_id === session_id);
    expect(created).toMatchObject({ venue_id: 'venue_ty', location_zh: '青衣樂區單車亭' });
  });

  it('refuses a Session with neither a Venue nor a location', async () => {
    await expect(handler(createSession)({ db: world() }, { ...base, location_zh: '  ' })).rejects.toThrow(/Venue or a location/);
  });

  it('keeps the Venue on edit unless the admin clears it', async () => {
    const db = world();
    db.tables.admins[0].role = 'super_admin';
    const edit = (extra: Record<string, unknown>) =>
      handler(updateSession)({ db }, { session_id: 'next', date: '2026-10-25', time: '10:00', quota_defined: 6, admin_username: 'admin', location_zh: '別處', ...extra });
    await edit({});
    expect(db.tables.sessions.find((s: any) => s.session_id === 'next')).toMatchObject({ venue_id: 'venue_ty', location_zh: '青衣樂區單車亭' });
    await edit({ venue_id: '' });
    expect(db.tables.sessions.find((s: any) => s.session_id === 'next')).toMatchObject({ venue_id: undefined, location_zh: '別處' });
  });
});
