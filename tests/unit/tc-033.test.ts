import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock convex/server so actionGeneric/mutationGeneric return their definition objects.
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

// Mock productMapping — not directly called by pollS3ForNewFiles (delegated to processS3File).
vi.mock('../../convex/productMapping', () => ({
  resolveClassId: vi.fn().mockReturnValue('class-tc033-abc'),
}));

import { S3Client } from '@aws-sdk/client-s3';
import { pollS3ForNewFiles } from '../../convex/s3Ingestion';

describe('TC-033 Partial poll writes status=partial', () => {
  let handler: (ctx: any, args: any) => Promise<any>;

  beforeEach(() => {
    vi.clearAllMocks();

    // S3 returns one CSV file in dev/new/
    vi.mocked(S3Client).mockImplementation(function(this: any) {
      this.send = vi.fn().mockResolvedValue({
        Contents: [{ Key: 'dev/new/202603301000---tc033-order.csv' }],
      });
    } as any);

    handler = (pollS3ForNewFiles as any).handler;
  });

  it('TC-033: ingestion_runs record has status=partial with rows_inserted>0 and rows_skipped>0 when processS3File skips unknown product row', async () => {
    // processS3File returns 1 inserted row, 1 skipped (unknown product_id)
    const runActionMock = vi.fn().mockResolvedValue({ rows_inserted: 1, rows_skipped: 1 });

    // Capture args passed to recordIngestionRun
    let recordedArgs: any = null;
    const runMutationMock = vi.fn().mockImplementation(async (_fnRef: string, args: any) => {
      recordedArgs = args;
      return 'ingestion-run-tc033-id';
    });

    const ctx = {
      runAction: runActionMock,
      runMutation: runMutationMock,
    };

    const result = await handler(ctx, {});

    // pollS3ForNewFiles return value
    expect(result.files_found).toBe(1);
    expect(result.files_processed).toBe(1);
    expect(result.rows_inserted).toBe(1);
    expect(result.rows_skipped).toBe(1);

    // recordIngestionRun was called once
    expect(runMutationMock).toHaveBeenCalledTimes(1);
    expect(runMutationMock.mock.calls[0][0]).toBe('s3IngestionMutations:recordIngestionRun');

    // DB record: status=partial with non-zero inserted and skipped
    expect(recordedArgs).not.toBeNull();
    expect(recordedArgs.status).toBe('partial');
    expect(recordedArgs.files_processed).toBe(1);
    expect(recordedArgs.rows_inserted).toBeGreaterThan(0);
    expect(recordedArgs.rows_skipped).toBeGreaterThan(0);
    expect(recordedArgs.rows_inserted).toBe(1);
    expect(recordedArgs.rows_skipped).toBe(1);
  });
});
