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
// Use regular function (not arrow) so it works as a constructor with `new`.
vi.mock('@aws-sdk/client-s3', () => ({
  S3Client: vi.fn(function(this: any) { this.send = vi.fn(); }),
  ListObjectsV2Command: vi.fn(function(this: any, args: any) { Object.assign(this, args); this._type = 'ListObjectsV2'; }),
  GetObjectCommand: vi.fn(function(this: any, args: any) { Object.assign(this, args); }),
  CopyObjectCommand: vi.fn(function(this: any, args: any) { Object.assign(this, args); }),
  DeleteObjectCommand: vi.fn(function(this: any, args: any) { Object.assign(this, args); }),
}));

// Mock productMapping (relative import from convex/s3Ingestion.ts).
vi.mock('../../convex/productMapping', () => ({
  resolveClassId: vi.fn().mockReturnValue('class-abc'),
}));

import { S3Client } from '@aws-sdk/client-s3';
import { pollS3ForNewFiles } from '../../convex/s3Ingestion';

describe('TC-006 S3 ListObjectsV2 network failure writes error run record', () => {
  let runMutationMock: ReturnType<typeof vi.fn>;
  let handler: (ctx: any, args: any) => Promise<any>;

  beforeEach(() => {
    vi.clearAllMocks();

    runMutationMock = vi.fn().mockResolvedValue('mock-run-id');

    // actionGeneric returns its definition object, so .handler is accessible.
    handler = (pollS3ForNewFiles as any).handler;
  });

  it('TC-006: records ingestion_run with status=error and error_message when S3 ListObjectsV2 throws', async () => {
    const networkError = new Error('Network failure: ECONNREFUSED 127.0.0.1:443');

    // Make S3Client.send throw a network error.
    // Must use a regular function (not arrow) so `new S3Client()` works.
    const sendMock = vi.fn().mockRejectedValue(networkError);
    vi.mocked(S3Client).mockImplementation(function(this: any) { this.send = sendMock; } as any);

    const ctx = {
      runMutation: runMutationMock,
      runAction: vi.fn(),
    };

    const result = await handler(ctx, {});

    // Should call runMutation with error status and the error message.
    expect(runMutationMock).toHaveBeenCalledOnce();
    expect(runMutationMock).toHaveBeenCalledWith(
      's3IngestionMutations:recordIngestionRun',
      expect.objectContaining({
        status: 'error',
        files_processed: 0,
        rows_inserted: 0,
        rows_skipped: 0,
        error_message: expect.stringContaining('Network failure'),
      })
    );

    // Should return zeroed stats (no throw — polling continues on next tick).
    expect(result).toEqual({
      files_found: 0,
      files_processed: 0,
      rows_inserted: 0,
      rows_skipped: 0,
      whatsapp_errors: 0,
    });
  });

  it('TC-006: does not throw when S3 ListObjectsV2 fails (polling continues)', async () => {
    vi.mocked(S3Client).mockImplementation(function(this: any) {
      this.send = vi.fn().mockRejectedValue(new Error('Timeout after 30000ms'));
    } as any);

    const ctx = {
      runMutation: runMutationMock,
      runAction: vi.fn(),
    };

    // Should not throw.
    await expect(handler(ctx, {})).resolves.not.toThrow();
  });
});
