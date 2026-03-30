import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock convex/server so mutationGeneric returns a plain definition object,
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

// Mock @aws-sdk/client-s3 — s3Ingestion imports it at the module level.
vi.mock('@aws-sdk/client-s3', () => ({
  S3Client: vi.fn(),
  GetObjectCommand: vi.fn(),
  CopyObjectCommand: vi.fn(),
  DeleteObjectCommand: vi.fn(),
  ListObjectsV2Command: vi.fn(),
}));

import { applyS3CsvRows } from '../../convex/s3Ingestion';

/**
 * Creates a simple in-memory mock of ctx.db that supports the query pattern
 * used by applyS3CsvRows:
 *   ctx.db.query("purchases")
 *     .withIndex("by_order_id", (q) => q.eq("order_id", value))
 *     .filter((q) => q.eq(q.field("class_id"), value))
 *     .first()
 */
function createMockDb() {
  const purchases: Record<string, any>[] = [];

  return {
    _purchases: purchases,

    insert: vi.fn(async (table: string, doc: Record<string, any>) => {
      const id = `mock_${table}_${purchases.length + 1}`;
      purchases.push({ ...doc, _id: id });
      return id;
    }),

    query: (_table: string) => {
      let byOrderId: string | undefined;

      return {
        withIndex: (_name: string, indexFn: (q: any) => any) => {
          indexFn({
            eq: (_field: string, value: string) => {
              byOrderId = value;
            },
          });

          return {
            filter: (filterFn: (q: any) => any) => {
              // Build a predicate from the filter lambda.
              // q.field(name) returns the field name string.
              // q.eq(lhs, rhs) returns a predicate object { _check(r) }.
              const q = {
                field: (name: string) => name,
                eq: (lhs: string, rhs: any) => ({
                  _check: (r: Record<string, any>) => r[lhs] === rhs,
                }),
              };
              const predicate = filterFn(q);

              return {
                first: async () => {
                  const byIndex = byOrderId
                    ? purchases.filter((r) => r['order_id'] === byOrderId)
                    : [...purchases];
                  const found = byIndex.find((r) => predicate._check(r));
                  return found ?? null;
                },
              };
            },
          };
        },
      };
    },
  };
}

describe('TC-029: Reprocessing same file does not create duplicate purchase records', () => {
  let handler: (ctx: any, args: any) => Promise<any>;

  beforeEach(() => {
    vi.clearAllMocks();
    handler = (applyS3CsvRows as any).handler;
  });

  it('TC-029: second processing run skips existing row and DB record count remains 1', async () => {
    const db = createMockDb();
    const ctx = {
      db,
      scheduler: { runAfter: vi.fn().mockResolvedValue(undefined) },
    };

    const rows = [
      {
        order_id: 'ORD-TC029-001',
        class_id: 'class-tc029-abc123',
        customer_mobile: '+6591234567',
        participant_count: 1,
        unit_price: 100.0,
        total_price: 100.0,
        purchase_datetime: '2026-03-30T12:00:00',
      },
    ];

    // --- First run: file processed normally ---
    const result1 = await handler(ctx, { rows });

    expect(result1.rows_inserted).toBe(1);
    expect(result1.rows_skipped).toBe(0);
    expect(db._purchases.length).toBe(1);

    // --- Second run: same file reprocessed (simulates failed move — file stayed in new/) ---
    const result2 = await handler(ctx, { rows });

    expect(result2.rows_inserted).toBe(0);
    expect(result2.rows_skipped).toBe(1);

    // Pass criterion: only 1 record in DB after both runs
    expect(db._purchases.length).toBe(1);

    console.log(
      'TC-029 evidence:',
      JSON.stringify(
        {
          first_run: {
            rows_inserted: result1.rows_inserted,
            rows_skipped: result1.rows_skipped,
          },
          second_run: {
            rows_inserted: result2.rows_inserted,
            rows_skipped: result2.rows_skipped,
          },
          db_record_count: db._purchases.length,
        },
        null,
        2,
      ),
    );
  });

  it('TC-029: deduplication applies per order_id+class_id — different class_id creates new record', async () => {
    const db = createMockDb();
    const ctx = {
      db,
      scheduler: { runAfter: vi.fn().mockResolvedValue(undefined) },
    };

    const row1 = {
      order_id: 'ORD-TC029-002',
      class_id: 'class-tc029-A',
      customer_mobile: '+6591234567',
      participant_count: 1,
      unit_price: 100.0,
      total_price: 100.0,
      purchase_datetime: '2026-03-30T12:00:00',
    };

    const row2 = {
      ...row1,
      class_id: 'class-tc029-B', // Different class_id — not a duplicate
    };

    const result1 = await handler(ctx, { rows: [row1] });
    expect(result1.rows_inserted).toBe(1);

    // Same order_id but different class_id — should insert
    const result2 = await handler(ctx, { rows: [row2] });
    expect(result2.rows_inserted).toBe(1);
    expect(db._purchases.length).toBe(2);

    // Reprocess row1 again — now a duplicate, must skip
    const result3 = await handler(ctx, { rows: [row1] });
    expect(result3.rows_inserted).toBe(0);
    expect(result3.rows_skipped).toBe(1);

    // Still only 2 records
    expect(db._purchases.length).toBe(2);
  });
});
