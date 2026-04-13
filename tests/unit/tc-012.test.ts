import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock convex/server so actionGeneric/mutationGeneric return their definition object,
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

// Mock @aws-sdk/client-s3 with a controllable send mock.
vi.mock('@aws-sdk/client-s3', () => ({
  S3Client: vi.fn(function(this: any) { this.send = vi.fn(); }),
  ListObjectsV2Command: vi.fn(function(this: any, args: any) { Object.assign(this, args); this._type = 'ListObjectsV2'; }),
  GetObjectCommand: vi.fn(function(this: any, args: any) { Object.assign(this, args); }),
  CopyObjectCommand: vi.fn(function(this: any, args: any) { Object.assign(this, args); }),
  DeleteObjectCommand: vi.fn(function(this: any, args: any) { Object.assign(this, args); }),
}));

// Mock productMapping to return undefined for all product_ids (simulates unknown product).
vi.mock('../../convex/productMapping', () => ({
  resolveClassId: vi.fn().mockReturnValue(undefined),
}));

import { S3Client } from '@aws-sdk/client-s3';
import { processS3File } from '../../convex/s3Ingestion';

const UNKNOWN_PRODUCT_CSV = [
  'order_id,product_id,user_phone,qty,unit_price,total',
  'ORD-001,UNKNOWN-PROD-999,+60123456789,1,100,100',
].join('\n');

describe('TC-012 Unknown product ID causes row skip with warning log', () => {
  let runMutationMock: ReturnType<typeof vi.fn>;
  let warnSpy: ReturnType<typeof vi.spyOn>;
  let handler: (ctx: any, args: any) => Promise<any>;

  beforeEach(() => {
    vi.clearAllMocks();

    runMutationMock = vi.fn().mockResolvedValue({ rows_inserted: 0, rows_skipped: 0 });
    warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    // Make S3Client.send return a CSV body with an unknown product_id for GetObject,
    // and succeed for Copy/Delete (file move after processing).
    vi.mocked(S3Client).mockImplementation(function(this: any) {
      this.send = vi.fn().mockImplementation(async (cmd: any) => {
        if (cmd._type === 'ListObjectsV2') return { Contents: [] };
        // GetObjectCommand — return CSV with unknown product_id
        return {
          Body: {
            transformToString: async () => UNKNOWN_PRODUCT_CSV,
          },
        };
      });
    } as any);

    handler = (processS3File as any).handler;
  });

  it('TC-012: logs console.warn with the unknown product_id', async () => {
    const runActionMock = vi.fn().mockResolvedValue({ success: true });
    const ctx = { runMutation: runMutationMock, runAction: runActionMock };

    await handler(ctx, {
      file_key: 'dev/new/202603300000---test.csv',
      bucket: 'test-bucket',
      env: 'dev',
      purchase_datetime: '2026-03-30T00:00:00',
    });

    expect(warnSpy).toHaveBeenCalledOnce();
    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining('UNKNOWN-PROD-999')
    );
  });

  it('TC-012: skips the row — applyS3CsvRows mutation is NOT called', async () => {
    const runActionMock = vi.fn().mockResolvedValue({ success: true });
    const ctx = { runMutation: runMutationMock, runAction: runActionMock };

    await handler(ctx, {
      file_key: 'dev/new/202603300000---test.csv',
      bucket: 'test-bucket',
      env: 'dev',
      purchase_datetime: '2026-03-30T00:00:00',
    });

    // runMutation should not be called because mappedRows is empty
    expect(runMutationMock).not.toHaveBeenCalled();
  });

  it('TC-012: returns rows_inserted=0 and rows_skipped=1', async () => {
    const runActionMock = vi.fn().mockResolvedValue({ success: true });
    const ctx = { runMutation: runMutationMock, runAction: runActionMock };

    const result = await handler(ctx, {
      file_key: 'dev/new/202603300000---test.csv',
      bucket: 'test-bucket',
      env: 'dev',
      purchase_datetime: '2026-03-30T00:00:00',
    });

    expect(result).toEqual({ rows_inserted: 0, rows_skipped: 1, whatsapp_errors: 0 });
  });
});
