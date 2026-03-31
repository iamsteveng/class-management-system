import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock convex/server so queryGeneric/mutationGeneric return their definition objects.
vi.mock('convex/server', () => ({
  queryGeneric: (def: any) => def,
  mutationGeneric: (def: any) => def,
  makeFunctionReference: (name: string) => name,
}));

// Mock convex/values — validators only need to not throw during module init.
vi.mock('convex/values', () => {
  const noop = (..._args: any[]): any => 'schema';
  const v = new Proxy({} as any, { get: () => noop });
  return { v };
});

import { getTermsPageData } from '../../convex/terms';

describe('TC-035 getTermsPageData excludes past sessions', () => {
  let handler: (ctx: any, args: any) => Promise<any>;

  // Fixed "now" for deterministic tests: 2026-04-01T12:00:00
  const FIXED_NOW = new Date('2026-04-01T12:00:00');

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    vi.setSystemTime(FIXED_NOW);
    handler = (getTermsPageData as any).handler;
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  function makeCtx(sessions: any[]) {
    const purchase = {
      _id: 'purchases:tc035-001',
      token: 'test-token-tc035',
      customer_mobile: '+85291234567',
      participant_count: 1,
      status: 'pending_terms',
      class_id: 'class-tc035',
      order_id: 'ORD-TC035',
    };

    const currentTerms = {
      _id: 'terms:tc035-001',
      version: '1.0',
      content: 'Terms content',
      is_current: true,
    };

    const classRecord = {
      _id: 'classes:tc035-001',
      class_id: 'class-tc035',
      name_zh: 'Test Class ZH',
      name_en: 'Test Class EN',
    };

    // Build db mock
    const makeQueryChain = (results: any) => ({
      withIndex: vi.fn().mockReturnThis(),
      filter: vi.fn().mockReturnThis(),
      collect: vi.fn().mockResolvedValue(results),
      first: vi.fn().mockResolvedValue(results),
    });

    const db = {
      query: vi.fn().mockImplementation((table: string) => {
        if (table === 'purchases') return makeQueryChain(purchase);
        if (table === 'terms_versions') return makeQueryChain(currentTerms);
        if (table === 'classes') return makeQueryChain(classRecord);
        if (table === 'sessions') return makeQueryChain(sessions);
        return makeQueryChain(null);
      }),
    };

    return { db };
  }

  it('TC-035: past session is excluded from returned sessions', async () => {
    const pastSession = {
      _id: 'sessions:tc035-past',
      session_id: 'sess-tc035-past',
      class_id: 'class-tc035',
      status: 'scheduled',
      quota_defined: 10,
      quota_used: 0,
      date: '2026-03-01',   // past date
      time: '10:00',
      location_zh: 'Location ZH',
    };

    const futureSession = {
      _id: 'sessions:tc035-future',
      session_id: 'sess-tc035-future',
      class_id: 'class-tc035',
      status: 'scheduled',
      quota_defined: 10,
      quota_used: 0,
      date: '2026-05-01',   // future date
      time: '10:00',
      location_zh: 'Location ZH',
    };

    const ctx = makeCtx([pastSession, futureSession]);
    const result = await handler(ctx, { token: 'test-token-tc035' });

    expect(result).not.toBeNull();
    const sessionIds = result.sessions.map((s: any) => s.session_id);

    // Past session must not appear
    expect(sessionIds).not.toContain('sess-tc035-past');
    // Future session must appear
    expect(sessionIds).toContain('sess-tc035-future');
  });

  it('TC-035: session at exactly now boundary (same minute) is excluded', async () => {
    // Session at the exact same time as now — new Date(...) is NOT > now, so should be excluded
    const sessionAtNow = {
      _id: 'sessions:tc035-now',
      session_id: 'sess-tc035-now',
      class_id: 'class-tc035',
      status: 'scheduled',
      quota_defined: 10,
      quota_used: 0,
      date: '2026-04-01',
      time: '12:00',   // exactly FIXED_NOW
      location_zh: 'Location ZH',
    };

    const ctx = makeCtx([sessionAtNow]);
    const result = await handler(ctx, { token: 'test-token-tc035' });

    expect(result).not.toBeNull();
    const sessionIds = result.sessions.map((s: any) => s.session_id);
    expect(sessionIds).not.toContain('sess-tc035-now');
  });

  it('TC-035: only past sessions → empty sessions array returned', async () => {
    const pastSession1 = {
      _id: 'sessions:tc035-p1',
      session_id: 'sess-tc035-p1',
      class_id: 'class-tc035',
      status: 'scheduled',
      quota_defined: 10,
      quota_used: 0,
      date: '2026-01-01',
      time: '09:00',
      location_zh: 'Location ZH',
    };

    const ctx = makeCtx([pastSession1]);
    const result = await handler(ctx, { token: 'test-token-tc035' });

    expect(result).not.toBeNull();
    expect(result.sessions).toHaveLength(0);
  });
});
