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

// Mock productMapping (relative import from convex/s3Ingestion.ts).
vi.mock('../../convex/productMapping', () => ({
  resolveClassId: vi.fn().mockReturnValue('class-abc'),
}));

import { S3Client } from '@aws-sdk/client-s3';
import { pollS3ForNewFiles } from '../../convex/s3Ingestion';

describe('TC-008 S3 error does not crash scheduler', () => {
  let runMutationMock: ReturnType<typeof vi.fn>;
  let handler: (ctx: any, args: any) => Promise<any>;

  beforeEach(() => {
    vi.clearAllMocks();

    runMutationMock = vi.fn().mockResolvedValue('mock-run-id');

    // actionGeneric returns its definition object, so .handler is accessible.
    handler = (pollS3ForNewFiles as any).handler;
  });

  it('TC-008: action resolves cleanly when S3 throws a network error', async () => {
    const networkError = new Error('connect ECONNREFUSED 127.0.0.1:443');
    networkError.name = 'NetworkingError';

    vi.mocked(S3Client).mockImplementation(function(this: any) {
      this.send = vi.fn().mockRejectedValue(networkError);
    } as any);

    const ctx = {
      runMutation: runMutationMock,
      runAction: vi.fn(),
    };

    // Should not throw — polling continues on next tick
    const result = await handler(ctx, {});

    expect(result).toEqual({
      files_found: 0,
      files_processed: 0,
      rows_inserted: 0,
      rows_skipped: 0,
    });
  });

  it('TC-008: records error ingestion_run when S3 throws a generic error', async () => {
    const genericError = new Error('Internal S3 service error');
    genericError.name = 'ServiceUnavailable';

    vi.mocked(S3Client).mockImplementation(function(this: any) {
      this.send = vi.fn().mockRejectedValue(genericError);
    } as any);

    const ctx = {
      runMutation: runMutationMock,
      runAction: vi.fn(),
    };

    await handler(ctx, {});

    expect(runMutationMock).toHaveBeenCalledOnce();
    expect(runMutationMock).toHaveBeenCalledWith(
      's3Ingestion:recordIngestionRun',
      expect.objectContaining({
        status: 'error',
        files_processed: 0,
        rows_inserted: 0,
        rows_skipped: 0,
        error_message: expect.stringContaining('Internal S3 service error'),
      })
    );
  });

  it('TC-008: no unhandled rejection — resolves even without catching at call site', async () => {
    const timeoutError = new Error('Request timeout');
    timeoutError.name = 'TimeoutError';

    vi.mocked(S3Client).mockImplementation(function(this: any) {
      this.send = vi.fn().mockRejectedValue(timeoutError);
    } as any);

    const ctx = {
      runMutation: runMutationMock,
      runAction: vi.fn(),
    };

    // Resolves (not rejects) — verifies no unhandled rejection escapes
    await expect(handler(ctx, {})).resolves.toBeDefined();
  });
});
