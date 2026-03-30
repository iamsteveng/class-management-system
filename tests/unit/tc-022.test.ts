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

describe('TC-022 Duplicate order_id + class_id returns existing _id without new record', () => {
  let handler: (ctx: any, args: any) => Promise<any>;

  beforeEach(() => {
    vi.clearAllMocks();
    handler = (createPurchase as any).handler;
  });

  it('TC-022: returns existing _id and does not insert a second record when called with duplicate order_id + class_id', async () => {
    const ORDER_ID = 'ORD-TC022-DUP';
    const CLASS_ID = 'class-tc022-xyz';
    const EXISTING_ID = 'existing-purchase-id-tc022';

    // Track all inserted records
    const insertedRecords: Array<{ table: string; record: any; id: string }> = [];
    let idCounter = 0;

    const insertMock = vi.fn().mockImplementation((table: string, record: any) => {
      const id = `new-purchase-id-${++idCounter}`;
      insertedRecords.push({ table, record, id });
      return Promise.resolve(id);
    });

    // The existing record that the first query returns on the second call
    const existingRecord = {
      _id: EXISTING_ID,
      order_id: ORDER_ID,
      class_id: CLASS_ID,
    };

    // First call: no existing record → inserts a new purchase
    // Second call: existing record found → returns existing _id without inserting
    let callCount = 0;
    const makeQueryChain = () => {
      callCount++;
      const isFirstCall = callCount === 1;
      return {
        withIndex: vi.fn().mockReturnThis(),
        filter: vi.fn().mockReturnThis(),
        first: vi.fn().mockResolvedValue(isFirstCall ? null : existingRecord),
      };
    };

    const ctx = {
      db: {
        query: vi.fn().mockImplementation(() => makeQueryChain()),
        insert: insertMock,
      },
    };

    const args = {
      order_id: ORDER_ID,
      customer_mobile: '+6591234567',
      participant_count: 1,
      class_id: CLASS_ID,
      source: 's3' as const,
      purchase_datetime: '2026-03-30T10:00:00',
    };

    // --- First call: should insert a new record ---
    const firstId = await handler(ctx, args);
    expect(insertMock).toHaveBeenCalledTimes(1);
    expect(firstId).toBe('new-purchase-id-1');

    // DB should have exactly 1 record for this order_id + class_id combination
    const recordsAfterFirst = insertedRecords.filter(
      (r) => r.record.order_id === ORDER_ID && r.record.class_id === CLASS_ID
    );
    expect(recordsAfterFirst).toHaveLength(1);

    // --- Second call with same order_id + class_id: should NOT insert ---
    const secondId = await handler(ctx, args);

    // Must return the existing record's _id
    expect(secondId).toBe(EXISTING_ID);

    // insert must still have been called only once (no second insert)
    expect(insertMock).toHaveBeenCalledTimes(1);

    // DB record count for this combination remains 1
    const recordsAfterSecond = insertedRecords.filter(
      (r) => r.record.order_id === ORDER_ID && r.record.class_id === CLASS_ID
    );
    expect(recordsAfterSecond).toHaveLength(1);
  });
});
