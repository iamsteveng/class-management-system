import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock convex/server so mutationGeneric/actionGeneric return their definition object
vi.mock('convex/server', () => ({
  actionGeneric: (def: any) => def,
  mutationGeneric: (def: any) => def,
  makeFunctionReference: (name: string) => name,
}));

// Mock convex/values — validators only need to not throw during module init
vi.mock('convex/values', () => {
  const noop = (..._args: any[]): any => 'schema';
  const v = new Proxy({} as any, { get: () => noop });
  return { v };
});

import { applyS3CsvRows } from '../../convex/s3IngestionMutations';
import { createPurchase } from '../../convex/purchases';

describe('TC-026 Split CSV row with qty > 1 into multiple purchase records', () => {
  let s3Handler: (ctx: any, args: any) => Promise<any>;
  let createHandler: (ctx: any, args: any) => Promise<any>;

  beforeEach(() => {
    vi.clearAllMocks();
    s3Handler = (applyS3CsvRows as any).handler;
    createHandler = (createPurchase as any).handler;
  });

  it('TC-026-A: CSV row with qty=2 produces 2 purchase records each with participant_count=1 and distinct tokens', async () => {
    const insertedRecords: any[] = [];
    let idCounter = 0;

    const ctx = {
      db: {
        query: vi.fn().mockReturnValue({
          withIndex: vi.fn().mockReturnValue({
            filter: vi.fn().mockReturnValue({
              first: vi.fn().mockResolvedValue(null), // no existing duplicates
            }),
          }),
        }),
        insert: vi.fn().mockImplementation((_table: string, record: any) => {
          insertedRecords.push(record);
          return Promise.resolve(`purchase-id-${++idCounter}`);
        }),
      },
    };

    const rows = [
      {
        order_id: 'TC026-ORDER-001',
        class_id: 'class-abc',
        customer_mobile: '+85212345678',
        participant_count: 2,
        unit_price: 100,
        total_price: 200,
        purchase_datetime: '2026-03-27T16:22:00',
      },
    ];

    const result = await s3Handler(ctx, { rows });

    expect(result.rows_inserted).toBe(2);
    expect(result.rows_skipped).toBe(0);
    expect(result.purchase_ids).toHaveLength(2);
    expect(insertedRecords).toHaveLength(2);

    // Each record has participant_count=1
    for (const rec of insertedRecords) {
      expect(rec.participant_count).toBe(1);
      expect(rec.order_id).toBe('TC026-ORDER-001');
      expect(rec.class_id).toBe('class-abc');
    }

    // Each record has a distinct token
    const tokens = insertedRecords.map((r) => r.token);
    expect(new Set(tokens).size).toBe(2);

    // slot_index values are 0 and 1
    const slots = insertedRecords.map((r) => r.slot_index).sort();
    expect(slots).toEqual([0, 1]);
  });

  it('TC-026-B: Reprocessing same file does not create duplicate records (idempotency with slot_index)', async () => {
    // Simulate all slots already existing
    const ctx = {
      db: {
        query: vi.fn().mockReturnValue({
          withIndex: vi.fn().mockReturnValue({
            filter: vi.fn().mockReturnValue({
              first: vi.fn().mockResolvedValue({ _id: 'existing-id', order_id: 'TC026-ORDER-002' }),
            }),
          }),
        }),
        insert: vi.fn(),
      },
    };

    const rows = [
      {
        order_id: 'TC026-ORDER-002',
        class_id: 'class-xyz',
        customer_mobile: '+85298765432',
        participant_count: 3,
        unit_price: 50,
        total_price: 150,
        purchase_datetime: '2026-03-27T16:22:00',
      },
    ];

    const result = await s3Handler(ctx, { rows });

    expect(result.rows_inserted).toBe(0);
    expect(result.rows_skipped).toBe(3);
    expect(result.purchase_ids).toHaveLength(0);
    expect(ctx.db.insert).not.toHaveBeenCalled();
  });

  it('TC-026-C: createPurchase stores slot_index=0 by default', async () => {
    let insertedRecord: any = null;

    const ctx = {
      db: {
        query: vi.fn().mockReturnValue({
          withIndex: vi.fn().mockReturnValue({
            filter: vi.fn().mockReturnValue({
              first: vi.fn().mockResolvedValue(null),
            }),
          }),
        }),
        insert: vi.fn().mockImplementation((_table: string, record: any) => {
          insertedRecord = record;
          return Promise.resolve('purchase-id-default-slot');
        }),
      },
    };

    await createHandler(ctx, {
      order_id: 'TC026-ORDER-003',
      customer_mobile: '+85211111111',
      participant_count: 1,
      source: 's3',
      purchase_datetime: '2026-03-27T16:22:00',
    });

    expect(insertedRecord).not.toBeNull();
    expect(insertedRecord.slot_index).toBe(0);
  });

  it('TC-026-D: createPurchase uses by_order_class_slot index for duplicate detection', async () => {
    const withIndexMock = vi.fn().mockReturnValue({
      filter: vi.fn().mockReturnValue({
        first: vi.fn().mockResolvedValue({ _id: 'existing-id' }),
      }),
    });

    const ctx = {
      db: {
        query: vi.fn().mockReturnValue({
          withIndex: withIndexMock,
        }),
        insert: vi.fn(),
      },
    };

    const result = await createHandler(ctx, {
      order_id: 'TC026-ORDER-004',
      customer_mobile: '+85222222222',
      participant_count: 1,
      source: 's3',
      purchase_datetime: '2026-03-27T16:22:00',
      slot_index: 1,
    });

    expect(result).toBe('existing-id');
    // Verify by_order_class_slot index was used
    expect(withIndexMock).toHaveBeenCalledWith(
      'by_order_class_slot',
      expect.any(Function)
    );
    expect(ctx.db.insert).not.toHaveBeenCalled();
  });
});
