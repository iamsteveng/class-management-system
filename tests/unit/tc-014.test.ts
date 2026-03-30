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

// Mock productMapping to return a valid class_id for product_id='PROD-001'.
vi.mock('../../convex/productMapping', () => ({
  resolveClassId: vi.fn().mockImplementation((_env: string, productId: string) => {
    if (productId === 'PROD-001') return 'class-xyz-456';
    return undefined;
  }),
}));

import { S3Client } from '@aws-sdk/client-s3';
import { processS3File } from '../../convex/s3Ingestion';

// CSV with qty=2 as a string value (as it would come from a CSV file)
const QTY_TWO_CSV = [
  'order_id,product_id,user_phone,qty,unit_price,total',
  'ORD-TC014,PROD-001,+60123456789,2,100,200',
].join('\n');

describe('TC-014 qty is stored as integer participant_count', () => {
  let runMutationMock: ReturnType<typeof vi.fn>;
  let handler: (ctx: any, args: any) => Promise<any>;

  beforeEach(() => {
    vi.clearAllMocks();

    runMutationMock = vi.fn().mockResolvedValue({ rows_inserted: 1, rows_skipped: 0 });

    vi.mocked(S3Client).mockImplementation(function(this: any) {
      this.send = vi.fn().mockImplementation(async (cmd: any) => {
        if (cmd._type === 'ListObjectsV2') return { Contents: [] };
        return {
          Body: {
            transformToString: async () => QTY_TWO_CSV,
          },
        };
      });
    } as any);

    handler = (processS3File as any).handler;
  });

  it('TC-014: participant_count is integer 2, not string "2"', async () => {
    const ctx = { runMutation: runMutationMock };

    await handler(ctx, {
      file_key: 'dev/new/202603300000---test.csv',
      bucket: 'test-bucket',
      env: 'dev',
      purchase_datetime: '2026-03-30T00:00:00',
    });

    expect(runMutationMock).toHaveBeenCalledOnce();
    const calledRows = runMutationMock.mock.calls[0][1].rows;
    expect(calledRows[0].participant_count).toBe(2);
    expect(typeof calledRows[0].participant_count).toBe('number');
    expect(Number.isInteger(calledRows[0].participant_count)).toBe(true);
  });
});
