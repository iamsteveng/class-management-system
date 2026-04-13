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

// Mock productMapping to return a valid class_id for product_id='3'.
vi.mock('../../convex/productMapping', () => ({
  resolveClassId: vi.fn().mockImplementation((_env: string, productId: string) => {
    if (productId === '3') return 'class-abc-123';
    return undefined;
  }),
}));

import { S3Client } from '@aws-sdk/client-s3';
import { processS3File } from '../../convex/s3Ingestion';

// CSV with leading/trailing whitespace on all data values
const WHITESPACE_CSV = [
  'order_id,product_id,user_phone,qty,unit_price,total',
  ' 36 , 3 , +85254304789 , 1 , 100.0000 , 100.0000',
].join('\n');

describe('TC-013 CSV values with leading/trailing whitespace are trimmed', () => {
  let runMutationMock: ReturnType<typeof vi.fn>;
  let handler: (ctx: any, args: any) => Promise<any>;

  beforeEach(() => {
    vi.clearAllMocks();

    runMutationMock = vi.fn().mockResolvedValue({ rows_inserted: 1, rows_skipped: 0, purchase_ids: ['purchase-id-1'] });

    vi.mocked(S3Client).mockImplementation(function(this: any) {
      this.send = vi.fn().mockImplementation(async (cmd: any) => {
        if (cmd._type === 'ListObjectsV2') return { Contents: [] };
        // GetObjectCommand — return CSV with whitespace-padded values
        return {
          Body: {
            transformToString: async () => WHITESPACE_CSV,
          },
        };
      });
    } as any);

    handler = (processS3File as any).handler;
  });

  it('TC-013: order_id is trimmed to "36"', async () => {
    const runActionMock = vi.fn().mockResolvedValue({ success: true });
    const ctx = { runMutation: runMutationMock, runAction: runActionMock };

    await handler(ctx, {
      file_key: 'dev/new/202603300000---test.csv',
      bucket: 'test-bucket',
      env: 'dev',
      purchase_datetime: '2026-03-30T00:00:00',
    });

    expect(runMutationMock).toHaveBeenCalledOnce();
    const calledRows = runMutationMock.mock.calls[0][1].rows;
    expect(calledRows[0].order_id).toBe('36');
  });

  it('TC-013: user_phone (customer_mobile) is trimmed to "+85254304789"', async () => {
    const runActionMock = vi.fn().mockResolvedValue({ success: true });
    const ctx = { runMutation: runMutationMock, runAction: runActionMock };

    await handler(ctx, {
      file_key: 'dev/new/202603300000---test.csv',
      bucket: 'test-bucket',
      env: 'dev',
      purchase_datetime: '2026-03-30T00:00:00',
    });

    const calledRows = runMutationMock.mock.calls[0][1].rows;
    expect(calledRows[0].customer_mobile).toBe('+85254304789');
  });

  it('TC-013: qty (participant_count) is parsed as integer 1', async () => {
    const runActionMock = vi.fn().mockResolvedValue({ success: true });
    const ctx = { runMutation: runMutationMock, runAction: runActionMock };

    await handler(ctx, {
      file_key: 'dev/new/202603300000---test.csv',
      bucket: 'test-bucket',
      env: 'dev',
      purchase_datetime: '2026-03-30T00:00:00',
    });

    const calledRows = runMutationMock.mock.calls[0][1].rows;
    expect(calledRows[0].participant_count).toBe(1);
  });

  it('TC-013: all fields trimmed — row is not skipped', async () => {
    const runActionMock = vi.fn().mockResolvedValue({ success: true });
    const ctx = { runMutation: runMutationMock, runAction: runActionMock };

    const result = await handler(ctx, {
      file_key: 'dev/new/202603300000---test.csv',
      bucket: 'test-bucket',
      env: 'dev',
      purchase_datetime: '2026-03-30T00:00:00',
    });

    // Row should be passed to mutation (not skipped due to whitespace)
    expect(runMutationMock).toHaveBeenCalledOnce();
    expect(result.rows_inserted).toBe(1);
    expect(result.rows_skipped).toBe(0);
  });
});
