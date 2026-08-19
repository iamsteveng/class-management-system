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
  let handler: (ctx: any, args: any) => Promise<any>;

  beforeEach(() => {
    vi.clearAllMocks();
    // actionGeneric returns its definition object, so .handler is accessible.
    handler = (pollS3ForNewFiles as any).handler;
  });

  it('TC-008: action resolves cleanly with zeroed counters when S3 throws a network error', async () => {
    const networkError = new Error('connect ECONNREFUSED 127.0.0.1:443');
    networkError.name = 'NetworkingError';

    vi.mocked(S3Client).mockImplementation(function(this: any) {
      this.send = vi.fn().mockRejectedValue(networkError);
    } as any);

    const ctx = {
      runMutation: vi.fn(),
      runAction: vi.fn(),
    };

    // Must resolve (early return), never reject — polling continues on next tick (US-002).
    await expect(handler(ctx, {})).resolves.toEqual({
      files_found: 0,
      files_processed: 0,
      rows_inserted: 0,
      rows_skipped: 0,
      whatsapp_errors: 0,
    });
  });
});
