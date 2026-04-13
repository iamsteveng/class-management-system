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

describe('TC-023 Same order_id with different class_id is NOT a duplicate', () => {
  let handler: (ctx: any, args: any) => Promise<any>;

  beforeEach(() => {
    vi.clearAllMocks();
    handler = (createPurchase as any).handler;
  });

  it('TC-023: inserts two distinct records when same order_id is used with different class_id values', async () => {
    const ORDER_ID = '36';
    const CLASS_A = 'class_a';
    const CLASS_B = 'class_b';

    // Track all inserted records to simulate DB state
    const insertedRecords: Array<{ table: string; record: any; id: string }> = [];
    let idCounter = 0;

    const insertMock = vi.fn().mockImplementation((table: string, record: any) => {
      const id = `purchase-id-${++idCounter}`;
      insertedRecords.push({ table, record, id });
      return Promise.resolve(id);
    });

    // Each call to db.query returns a chain that checks the inserted records
    // for an exact order_id + class_id match (mirroring the real duplicate check).
    const makeQueryChain = (class_id: string) => ({
      withIndex: vi.fn().mockReturnThis(),
      filter: vi.fn().mockImplementation((filterFn: any) => ({
        first: vi.fn().mockResolvedValue(
          insertedRecords.find(
            (r) => r.record.order_id === ORDER_ID && r.record.class_id === class_id
          ) ?? null
        ),
      })),
    });

    // db.query is called once per handler invocation; we capture the class_id
    // from the args closure so the chain can check the right record.
    let currentClassId = CLASS_A;
    const ctx = {
      db: {
        query: vi.fn().mockImplementation(() => makeQueryChain(currentClassId)),
        insert: insertMock,
      },
    };

    const baseArgs = {
      order_id: ORDER_ID,
      customer_mobile: '+6591234567',
      participant_count: 1,
      source: 's3' as const,
      purchase_datetime: '2026-03-30T10:00:00',
    };

    // --- First call: order_id=36, class_id=class_a → should insert ---
    currentClassId = CLASS_A;
    const firstId = await handler(ctx, { ...baseArgs, class_id: CLASS_A });
    expect(insertMock).toHaveBeenCalledTimes(1);
    expect(firstId).toBe('purchase-id-1');

    // --- Second call: order_id=36, class_id=class_b → NOT a duplicate, should insert ---
    currentClassId = CLASS_B;
    const secondId = await handler(ctx, { ...baseArgs, class_id: CLASS_B });
    expect(insertMock).toHaveBeenCalledTimes(2);
    expect(secondId).toBe('purchase-id-2');

    // Two distinct IDs
    expect(firstId).not.toBe(secondId);

    // DB record count = 2
    expect(insertedRecords).toHaveLength(2);

    // Each record has the correct class_id
    const recordA = insertedRecords.find((r) => r.record.class_id === CLASS_A);
    const recordB = insertedRecords.find((r) => r.record.class_id === CLASS_B);
    expect(recordA).toBeDefined();
    expect(recordB).toBeDefined();
    expect(recordA!.record.order_id).toBe(ORDER_ID);
    expect(recordB!.record.order_id).toBe(ORDER_ID);
    expect(recordA!.record.class_id).toBe(CLASS_A);
    expect(recordB!.record.class_id).toBe(CLASS_B);
  });
});
