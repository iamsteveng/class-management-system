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

describe('TC-025 createPurchase accepts source=payment_gateway', () => {
  let handler: (ctx: any, args: any) => Promise<any>;

  beforeEach(() => {
    vi.clearAllMocks();
    handler = (createPurchase as any).handler;
  });

  it('TC-025: DB record has source="payment_gateway" when createPurchase is called with source="payment_gateway"', async () => {
    let insertedRecord: any = null;

    const insertMock = vi.fn().mockImplementation((_table: string, record: any) => {
      insertedRecord = record;
      return Promise.resolve('purchase-id-pg-1');
    });

    const ctx = {
      db: {
        query: vi.fn().mockReturnValue({
          withIndex: vi.fn().mockReturnThis(),
          filter: vi.fn().mockReturnValue({
            first: vi.fn().mockResolvedValue(null), // no existing duplicate
          }),
        }),
        insert: insertMock,
      },
    };

    const args = {
      order_id: 'TC025-ORDER-001',
      customer_mobile: '+6591234567',
      participant_count: 1,
      source: 'payment_gateway' as const,
      purchase_datetime: '2026-03-30T10:00:00',
    };

    const result = await handler(ctx, args);

    expect(result).toBe('purchase-id-pg-1');
    expect(insertMock).toHaveBeenCalledTimes(1);
    expect(insertedRecord).not.toBeNull();
    expect(insertedRecord.source).toBe('payment_gateway');
  });
});
