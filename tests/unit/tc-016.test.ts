import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock convex/server so actionGeneric/mutationGeneric return their definition object.
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

// Mock @aws-sdk/client-s3 with a controllable send mock.
vi.mock('@aws-sdk/client-s3', () => ({
  S3Client: vi.fn(function(this: any) { this.send = vi.fn(); }),
  ListObjectsV2Command: vi.fn(function(this: any, args: any) { Object.assign(this, args); this._type = 'ListObjectsV2'; }),
  GetObjectCommand: vi.fn(function(this: any, args: any) { Object.assign(this, args); }),
  CopyObjectCommand: vi.fn(function(this: any, args: any) { Object.assign(this, args); }),
  DeleteObjectCommand: vi.fn(function(this: any, args: any) { Object.assign(this, args); }),
}));

// Mock productMapping: product_id=3 → class-aaa, product_id=5 → class-bbb
vi.mock('../../convex/productMapping', () => ({
  resolveClassId: vi.fn().mockImplementation((_env: string, productId: string) => {
    if (productId === '3') return 'class-aaa';
    if (productId === '5') return 'class-bbb';
    return undefined;
  }),
}));

import { S3Client } from '@aws-sdk/client-s3';
import { processS3File } from '../../convex/s3Ingestion';

const CSV_TWO_ROWS_SAME_ORDER = [
  'order_id,product_id,user_phone,qty,unit_price,total',
  '36,3,+85291234567,1,100,100',
  '36,5,+85291234567,1,200,200',
].join('\n');

describe('TC-016 Two rows with same order_id but different product_id produce two purchase records', () => {
  let runMutationMock: ReturnType<typeof vi.fn>;
  let handler: (ctx: any, args: any) => Promise<any>;

  beforeEach(() => {
    vi.clearAllMocks();

    runMutationMock = vi.fn().mockResolvedValue({ rows_inserted: 2, rows_skipped: 0, purchase_ids: ['purchase-id-1', 'purchase-id-2'] });

    vi.mocked(S3Client).mockImplementation(function(this: any) {
      this.send = vi.fn().mockImplementation(async (cmd: any) => {
        if (cmd._type === 'ListObjectsV2') return { Contents: [] };
        return {
          Body: {
            transformToString: async () => CSV_TWO_ROWS_SAME_ORDER,
          },
        };
      });
    } as any);

    handler = (processS3File as any).handler;
  });

  it('TC-016: two rows with order_id=36 but different product_id produce two records with distinct class_ids', async () => {
    const runActionMock = vi.fn().mockResolvedValue({ success: true });
    const ctx = { runMutation: runMutationMock, runAction: runActionMock };

    const result = await handler(ctx, {
      file_key: 'dev/new/202603300000---test.csv',
      bucket: 'test-bucket',
      env: 'dev',
      purchase_datetime: '2026-03-30T00:00:00',
    });

    // runMutation should have been called once with both rows
    expect(runMutationMock).toHaveBeenCalledOnce();

    const calledRows = runMutationMock.mock.calls[0][1].rows;

    // Two purchase records should be passed
    expect(calledRows).toHaveLength(2);

    // Both rows share the same order_id
    expect(calledRows[0].order_id).toBe('36');
    expect(calledRows[1].order_id).toBe('36');

    // Each row has a distinct class_id
    expect(calledRows[0].class_id).toBe('class-aaa');
    expect(calledRows[1].class_id).toBe('class-bbb');

    // The mutation return value propagates correctly
    expect(result.rows_inserted).toBe(2);
    expect(result.rows_skipped).toBe(0);
  });
});
