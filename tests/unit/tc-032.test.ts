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

// Mock productMapping to return a valid class_id.
vi.mock('../../convex/productMapping', () => ({
  resolveClassId: vi.fn().mockReturnValue('class-tc032-abc'),
}));

import { S3Client } from '@aws-sdk/client-s3';
import { pollS3ForNewFiles } from '../../convex/s3Ingestion';

describe('TC-032 Successful poll writes ingestion_runs record with status=success', () => {
  let handler: (ctx: any, args: any) => Promise<any>;

  beforeEach(() => {
    vi.clearAllMocks();

    // S3 returns one CSV file in dev/new/
    vi.mocked(S3Client).mockImplementation(function(this: any) {
      this.send = vi.fn().mockResolvedValue({
        Contents: [{ Key: 'dev/new/202603301000---tc032-order.csv' }],
      });
    } as any);

    handler = (pollS3ForNewFiles as any).handler;
  });

  it('TC-032: ingestion_runs record has status=success, files_processed=1, rows_inserted=2, rows_skipped=0', async () => {
    // processS3File returns 2 inserted rows, 0 skipped
    const runActionMock = vi.fn().mockResolvedValue({ rows_inserted: 2, rows_skipped: 0 });

    // Capture the args passed to recordIngestionRun
    let recordedArgs: any = null;
    const runMutationMock = vi.fn().mockImplementation(async (_fnRef: string, args: any) => {
      recordedArgs = args;
      return 'ingestion-run-tc032-id';
    });

    const ctx = {
      runAction: runActionMock,
      runMutation: runMutationMock,
    };

    const result = await handler(ctx, {});

    // pollS3ForNewFiles return value
    expect(result.files_found).toBe(1);
    expect(result.files_processed).toBe(1);
    expect(result.rows_inserted).toBe(2);
    expect(result.rows_skipped).toBe(0);

    // recordIngestionRun was called once
    expect(runMutationMock).toHaveBeenCalledTimes(1);
    expect(runMutationMock.mock.calls[0][0]).toBe('s3Ingestion:recordIngestionRun');

    // DB record assertions
    expect(recordedArgs).not.toBeNull();
    expect(recordedArgs.status).toBe('success');
    expect(recordedArgs.files_processed).toBe(1);
    expect(recordedArgs.rows_inserted).toBe(2);
    expect(recordedArgs.rows_skipped).toBe(0);
    expect(recordedArgs.error_message).toBeUndefined();
  });
});
