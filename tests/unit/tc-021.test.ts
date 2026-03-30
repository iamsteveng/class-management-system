import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock convex/server so mutationGeneric returns its definition object,
// allowing us to access .handler directly in tests.
vi.mock('convex/server', () => ({
  actionGeneric: (def: any) => def,
  mutationGeneric: (def: any) => def,
  makeFunctionReference: (name: string) => name,
}));

// Mock convex/values — validators only need to not throw during module init.
vi.mock('convex/values', () => {
  const noop = (..._args: any[]): any => 'schema';
  const v = new Proxy({} as any, { get: () => noop });
  return { v };
});

import { createPurchase } from '../../convex/purchases';

describe('TC-021 createPurchase generates unique UUID token', () => {
  let handler: (ctx: any, args: any) => Promise<any>;

  beforeEach(() => {
    vi.clearAllMocks();
    handler = (createPurchase as any).handler;
  });

  function makeCtx() {
    const insertedId = { value: 0 };
    const queryChain = {
      withIndex: vi.fn().mockReturnThis(),
      filter: vi.fn().mockReturnThis(),
      first: vi.fn().mockResolvedValue(null), // no duplicates
    };
    const insertMock = vi.fn().mockImplementation((_table: string, record: any) => {
      return Promise.resolve(`purchase-id-${insertedId.value++}`);
    });
    return {
      db: {
        query: vi.fn().mockReturnValue(queryChain),
        insert: insertMock,
      },
      _insertMock: insertMock,
    };
  }

  const UUID_V4_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

  it('TC-021: tokens are UUID v4 format and distinct across two purchases', async () => {
    const ctx = makeCtx();

    const baseArgs = {
      customer_mobile: '+6591234567',
      participant_count: 1,
      source: 's3' as const,
      purchase_datetime: '2026-03-30T10:00:00',
    };

    await handler(ctx, { ...baseArgs, order_id: 'ORD-TC021-A' });
    await handler(ctx, { ...baseArgs, order_id: 'ORD-TC021-B' });

    expect(ctx._insertMock).toHaveBeenCalledTimes(2);

    const token1: string = ctx._insertMock.mock.calls[0][1].token;
    const token2: string = ctx._insertMock.mock.calls[1][1].token;

    // Both tokens must be non-empty
    expect(token1).toBeTruthy();
    expect(token2).toBeTruthy();

    // Both tokens must match UUID v4 format
    expect(token1).toMatch(UUID_V4_RE);
    expect(token2).toMatch(UUID_V4_RE);

    // Tokens must be distinct
    expect(token1).not.toBe(token2);
  });
});
