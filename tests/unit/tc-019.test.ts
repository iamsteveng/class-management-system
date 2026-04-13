import { describe, it, expect, vi } from 'vitest';

// Mock convex/server so module-level actionGeneric/mutationGeneric calls don't throw.
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
  ListObjectsV2Command: vi.fn(),
  GetObjectCommand: vi.fn(),
  CopyObjectCommand: vi.fn(),
  DeleteObjectCommand: vi.fn(),
}));

vi.mock('../../convex/productMapping', () => ({
  resolveClassId: vi.fn(),
}));

import { parseDatetimeFromFilename } from '../../convex/s3Ingestion';

describe('TC-019 Filename with directory prefix still parses correctly', () => {
  it('TC-019: parseDatetimeFromFilename ignores directory prefix and returns correct datetime', () => {
    const result = parseDatetimeFromFilename('dev/new/202603271622---abc.csv');
    expect(result).toBe('2026-03-27T16:22:00');
  });
});
