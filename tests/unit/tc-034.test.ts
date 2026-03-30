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

// Mock productMapping — not called when no files are found.
vi.mock('../../convex/productMapping', () => ({
  resolveClassId: vi.fn().mockReturnValue(undefined),
}));

import { S3Client } from '@aws-sdk/client-s3';
import { pollS3ForNewFiles } from '../../convex/s3Ingestion';

describe('TC-034 Empty S3 bucket writes status=success with zero counts', () => {
  let handler: (ctx: any, args: any) => Promise<any>;

  beforeEach(() => {
    vi.clearAllMocks();

    // S3 returns empty list (no files in dev/new/)
    vi.mocked(S3Client).mockImplementation(function(this: any) {
      this.send = vi.fn().mockResolvedValue({
        Contents: [],
      });
    } as any);

    handler = (pollS3ForNewFiles as any).handler;
  });

  it('TC-034: ingestion_runs record has status=success, files_processed=0, rows_inserted=0, rows_skipped=0', async () => {
    const runActionMock = vi.fn();

    // Capture the args passed to recordIngestionRun
    let recordedArgs: any = null;
    const runMutationMock = vi.fn().mockImplementation(async (_fnRef: string, args: any) => {
      recordedArgs = args;
      return 'ingestion-run-tc034-id';
    });

    const ctx = {
      runAction: runActionMock,
      runMutation: runMutationMock,
    };

    const result = await handler(ctx, {});

    // pollS3ForNewFiles return value — no files found or processed
    expect(result.files_found).toBe(0);
    expect(result.files_processed).toBe(0);
    expect(result.rows_inserted).toBe(0);
    expect(result.rows_skipped).toBe(0);

    // processS3File (runAction) should never be called
    expect(runActionMock).not.toHaveBeenCalled();

    // recordIngestionRun was called once
    expect(runMutationMock).toHaveBeenCalledTimes(1);
    expect(runMutationMock.mock.calls[0][0]).toBe('s3Ingestion:recordIngestionRun');

    // DB record assertions: status=success with all zero counts
    expect(recordedArgs).not.toBeNull();
    expect(recordedArgs.status).toBe('success');
    expect(recordedArgs.files_processed).toBe(0);
    expect(recordedArgs.rows_inserted).toBe(0);
    expect(recordedArgs.rows_skipped).toBe(0);
    expect(recordedArgs.error_message).toBeUndefined();
  });
});
