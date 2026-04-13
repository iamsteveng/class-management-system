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

describe('TC-020 createPurchase inserts purchase with correct fields', () => {
  let insertMock: ReturnType<typeof vi.fn>;
  let handler: (ctx: any, args: any) => Promise<any>;

  beforeEach(() => {
    vi.clearAllMocks();

    insertMock = vi.fn().mockResolvedValue('mock-purchase-id');

    // mutationGeneric returns its definition object, so .handler is accessible.
    handler = (createPurchase as any).handler;
  });

  function makeCtx(existingRecord: any = null) {
    // Build a chainable mock for ctx.db.query(...).withIndex(...).filter(...).first()
    const queryChain = {
      withIndex: vi.fn().mockReturnThis(),
      filter: vi.fn().mockReturnThis(),
      first: vi.fn().mockResolvedValue(existingRecord),
    };
    return {
      db: {
        query: vi.fn().mockReturnValue(queryChain),
        insert: insertMock,
      },
    };
  }

  it('TC-020: inserts purchase with all required fields and correct values', async () => {
    const ctx = makeCtx(null); // no existing duplicate

    const args = {
      order_id: 'ORD-TEST-001',
      customer_mobile: '+6591234567',
      participant_count: 2,
      class_id: 'class-abc-123',
      source: 's3' as const,
      unit_price: 100,
      total_price: 200,
      purchase_datetime: '2026-03-30T10:00:00',
    };

    const result = await handler(ctx, args);

    expect(result).toBe('mock-purchase-id');

    // db.insert must be called once with "purchases" as the table name
    expect(insertMock).toHaveBeenCalledOnce();
    expect(insertMock).toHaveBeenCalledWith('purchases', expect.any(Object));

    const insertedRecord = insertMock.mock.calls[0][1];

    // Assert all required fields are present with correct values
    expect(insertedRecord.order_id).toBe('ORD-TEST-001');
    expect(insertedRecord.customer_mobile).toBe('+6591234567');
    expect(insertedRecord.participant_count).toBe(2);
    expect(insertedRecord.class_id).toBe('class-abc-123');
    expect(insertedRecord.source).toBe('s3');
    expect(insertedRecord.purchase_datetime).toBe('2026-03-30T10:00:00');
    expect(insertedRecord.status).toBe('pending_terms');
    // token must be a UUID (8-4-4-4-12 hex pattern)
    expect(insertedRecord.token).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    );
    expect(typeof insertedRecord.created_at).toBe('number');
    expect(insertedRecord.created_at).toBeGreaterThan(0);
  });

  it('TC-020: returns existing purchase ID when duplicate order_id + class_id exists', async () => {
    const existing = { _id: 'existing-purchase-id', order_id: 'ORD-TEST-001', class_id: 'class-abc-123' };
    const ctx = makeCtx(existing);

    const args = {
      order_id: 'ORD-TEST-001',
      customer_mobile: '+6591234567',
      participant_count: 1,
      class_id: 'class-abc-123',
      source: 's3' as const,
      purchase_datetime: '2026-03-30T10:00:00',
    };

    const result = await handler(ctx, args);

    // Should return the existing ID without inserting a new record
    expect(result).toBe('existing-purchase-id');
    expect(insertMock).not.toHaveBeenCalled();
  });

  it('TC-020: source field is stored correctly for payment_gateway source', async () => {
    const ctx = makeCtx(null);

    const args = {
      order_id: 'ORD-PG-001',
      customer_mobile: '+6599887766',
      participant_count: 1,
      source: 'payment_gateway' as const,
      purchase_datetime: '2026-03-30T11:00:00',
    };

    await handler(ctx, args);

    const insertedRecord = insertMock.mock.calls[0][1];
    expect(insertedRecord.source).toBe('payment_gateway');
    expect(insertedRecord.status).toBe('pending_terms');
    expect(insertedRecord.class_id).toBeUndefined();
  });
});
