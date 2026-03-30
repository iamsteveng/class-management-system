import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock convex/server so mutationGeneric/actionGeneric return their definition objects,
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

import { applyS3CsvRows } from '../../convex/s3IngestionMutations';

describe('TC-030 sendPurchaseConfirmation called after successful createPurchase', () => {
  let handler: (ctx: any, args: any) => Promise<any>;

  beforeEach(() => {
    vi.clearAllMocks();
    handler = (applyS3CsvRows as any).handler;
  });

  it('TC-030: scheduler.runAfter called once with new purchase_id after inserting a valid CSV row', async () => {
    const purchaseId = 'purchase-tc030-001';

    const insertMock = vi.fn().mockResolvedValue(purchaseId);
    const schedulerRunAfterMock = vi.fn().mockResolvedValue(undefined);

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
      scheduler: {
        runAfter: schedulerRunAfterMock,
      },
    };

    const args = {
      rows: [
        {
          order_id: 'TC030-ORDER-001',
          class_id: 'class-abc-123',
          customer_mobile: '+6591234567',
          participant_count: 1,
          unit_price: 100,
          total_price: 100,
          purchase_datetime: '2026-03-30T10:00:00',
        },
      ],
    };

    const result = await handler(ctx, args);

    // Purchase was created
    expect(insertMock).toHaveBeenCalledTimes(1);
    expect(result.rows_inserted).toBe(1);
    expect(result.rows_skipped).toBe(0);

    // sendPurchaseConfirmation was scheduled exactly once with the new purchase_id
    expect(schedulerRunAfterMock).toHaveBeenCalledTimes(1);
    const [delay, fnRef, fnArgs] = schedulerRunAfterMock.mock.calls[0];
    expect(delay).toBe(0);
    expect(fnRef).toBe('purchaseConfirmation:sendPurchaseConfirmation');
    expect(fnArgs).toEqual({ purchase_id: purchaseId });
  });
});
