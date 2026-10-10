import { describe, it, expect, vi, afterEach } from 'vitest';

vi.mock('convex/server', () => ({
  queryGeneric: (def: any) => def,
  mutationGeneric: (def: any) => def,
  internalQueryGeneric: (def: any) => def,
  internalMutationGeneric: (def: any) => def,
  makeFunctionReference: (name: string) => name,
}));
vi.mock('convex/values', () => {
  const noop = (..._args: any[]): any => 'schema';
  return { v: new Proxy({} as any, { get: () => noop }) };
});

import { listClassesOnSale } from '../../convex/homepage';
import { handler, makeDb } from './helpers/fakeDb';

// /api/classes serves homepage:listClassesOnSale to callers outside this site (e.g. the
// app), so a Class's image must come back as a full URL they can load.

const classWithImage = (image_url?: string) =>
  makeDb({
    classes: [
      { _id: 'c', class_id: 'class_cycling_kids', name_zh: '幼兒班', status: 'active', airwallex_price: 180, image_url, created_at: 1 },
    ],
    sessions: [],
    seat_holds: [],
  });

const imageUrlOf = async (image_url?: string) =>
  (await handler(listClassesOnSale)({ db: classWithImage(image_url) }, {}))[0].image_url;

afterEach(() => vi.unstubAllEnvs());

describe('/api/classes image_url', () => {
  it('turns a site path into a full URL on this site', async () => {
    vi.stubEnv('APP_BASE_URL', 'https://academy.loco.hk');
    expect(await imageUrlOf('/images/revamp/class-kids.jpg')).toBe('https://academy.loco.hk/images/revamp/class-kids.jpg');
  });

  it('leaves a full URL as it is', async () => {
    vi.stubEnv('APP_BASE_URL', 'https://academy.loco.hk');
    expect(await imageUrlOf('https://cdn.example.com/kids.jpg')).toBe('https://cdn.example.com/kids.jpg');
  });

  it('leaves a Class without an image without one', async () => {
    vi.stubEnv('APP_BASE_URL', 'https://academy.loco.hk');
    expect(await imageUrlOf(undefined)).toBeUndefined();
  });

  it('returns the path as it is when APP_BASE_URL is not configured', async () => {
    vi.stubEnv('APP_BASE_URL', '');
    expect(await imageUrlOf('/images/revamp/class-kids.jpg')).toBe('/images/revamp/class-kids.jpg');
  });
});
