import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('convex/server', () => ({
  actionGeneric: (def: any) => def,
  mutationGeneric: (def: any) => def,
  makeFunctionReference: (name: string) => name,
}));

vi.mock('convex/values', () => {
  const noop = (..._args: any[]): any => 'schema';
  const v = new Proxy({} as any, { get: () => noop });
  return { v };
});

vi.mock('@aws-sdk/client-s3', () => ({
  S3Client: vi.fn(function(this: any) { this.send = vi.fn(); }),
  ListObjectsV2Command: vi.fn(function(this: any, args: any) { Object.assign(this, args); this._type = 'ListObjectsV2'; }),
  GetObjectCommand: vi.fn(function(this: any, args: any) { Object.assign(this, args); }),
  CopyObjectCommand: vi.fn(function(this: any, args: any) { Object.assign(this, args); }),
  DeleteObjectCommand: vi.fn(function(this: any, args: any) { Object.assign(this, args); }),
}));

vi.mock('../../convex/productMapping', () => ({
  resolveClassId: vi.fn().mockReturnValue('class-abc-123'),
}));

import { S3Client } from '@aws-sdk/client-s3';
import { processS3File } from '../../convex/s3Ingestion';

const VALID_CSV = [
  'order_id,product_id,user_phone,qty,unit_price,total',
  'TC030-001,3,+6591234567,1,100.0000,100.0000',
].join('\n');

describe('TC-030 sendPurchaseConfirmation called after successful createPurchase', () => {
  let runMutationMock: ReturnType<typeof vi.fn>;
  let runActionMock: ReturnType<typeof vi.fn>;
  let handler: (ctx: any, args: any) => Promise<any>;

  beforeEach(() => {
    vi.clearAllMocks();

    runMutationMock = vi.fn().mockResolvedValue({ rows_inserted: 1, rows_skipped: 0, purchase_ids: ['purchase-tc030-001'] });
    runActionMock = vi.fn().mockResolvedValue({ success: true });

    vi.mocked(S3Client).mockImplementation(function(this: any) {
      this.send = vi.fn().mockImplementation(async (cmd: any) => {
        if (cmd._type === 'ListObjectsV2') return { Contents: [] };
        return { Body: { transformToString: async () => VALID_CSV } };
      });
    } as any);

    handler = (processS3File as any).handler;
  });

  it('TC-030: sendPurchaseConfirmation called once with new purchase_id after inserting a valid CSV row', async () => {
    const ctx = { runMutation: runMutationMock, runAction: runActionMock };

    await handler(ctx, {
      file_key: 'dev/new/202603300000---test.csv',
      bucket: 'test-bucket',
      env: 'dev',
      purchase_datetime: '2026-03-30T00:00:00',
    });

    // applyS3CsvRows was called (rows were inserted)
    expect(runMutationMock).toHaveBeenCalledWith(
      's3IngestionMutations:applyS3CsvRows',
      expect.objectContaining({ rows: expect.any(Array) })
    );

    // sendPurchaseConfirmation was called via runAction for each purchase_id
    const sendCalls = runActionMock.mock.calls.filter(
      (c: any[]) => c[0] === 'purchaseConfirmation:sendPurchaseConfirmation'
    );
    expect(sendCalls.length).toBe(1);
    expect(sendCalls[0][1]).toEqual({ purchase_id: 'purchase-tc030-001' });
  });
});
