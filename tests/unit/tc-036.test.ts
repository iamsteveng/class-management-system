import { describe, it, expect, vi, beforeEach } from 'vitest';

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

describe('TC-036 getTermsPageData returns empty sessions when purchase has no class_id', () => {
  let handler: (ctx: any, args: any) => Promise<any>;

  beforeEach(() => {
    vi.clearAllMocks();
    handler = (getTermsPageData as any).handler;
  });

  function makeCtx(classId: string | undefined | null) {
    const purchase = {
      _id: 'purchases:tc036-001',
      token: 'test-token-tc036',
      customer_mobile: '+85291234567',
      participant_count: 1,
      status: 'pending_terms',
      class_id: classId,
      order_id: 'ORD-TC036',
    };

    const currentTerms = {
      _id: 'terms:tc036-001',
      version: '1.0',
      content: 'Terms content',
      is_current: true,
    };

    const collectMock = vi.fn().mockResolvedValue([]);

    const makeQueryChain = (firstResult: any) => ({
      withIndex: vi.fn().mockReturnThis(),
      filter: vi.fn().mockReturnThis(),
      collect: collectMock,
      first: vi.fn().mockResolvedValue(firstResult),
    });

    const db = {
      query: vi.fn().mockImplementation((table: string) => {
        if (table === 'purchases') return makeQueryChain(purchase);
        if (table === 'terms_versions') return makeQueryChain(currentTerms);
        if (table === 'classes') return makeQueryChain(null);
        if (table === 'sessions') return makeQueryChain(null);
        return makeQueryChain(null);
      }),
      collectMock,
    };

    return { db, collectMock };
  }

  it('TC-036: returns empty sessions array when purchase.class_id is undefined', async () => {
    const { db, collectMock } = makeCtx(undefined);
    const result = await handler({ db }, { token: 'test-token-tc036' });

    expect(result).not.toBeNull();
    expect(result.sessions).toEqual([]);
    // Sessions DB query must NOT be called (no class_id → short-circuit to [])
    expect(collectMock).not.toHaveBeenCalled();
  });

  it('TC-036: returns empty sessions array when purchase.class_id is null', async () => {
    const { db, collectMock } = makeCtx(null);
    const result = await handler({ db }, { token: 'test-token-tc036' });

    expect(result).not.toBeNull();
    expect(result.sessions).toEqual([]);
    expect(collectMock).not.toHaveBeenCalled();
  });

  it('TC-036: returns empty sessions array when purchase.class_id is empty string', async () => {
    const { db, collectMock } = makeCtx('');
    const result = await handler({ db }, { token: 'test-token-tc036' });

    expect(result).not.toBeNull();
    expect(result.sessions).toEqual([]);
    expect(collectMock).not.toHaveBeenCalled();
  });
});
