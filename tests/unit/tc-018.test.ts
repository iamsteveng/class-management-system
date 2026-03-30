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

describe('TC-018 Malformed filename falls back to current time', () => {
  it('TC-018: parseDatetimeFromFilename returns valid ISO 8601 string for malformed filename without throwing', () => {
    const before = new Date();
    let result: string;
    expect(() => {
      result = parseDatetimeFromFilename('no-timestamp-file.csv');
    }).not.toThrow();
    // Result must match ISO 8601 pattern
    expect(result!).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
    // Result should be close to current time (within 5 seconds)
    const parsed = new Date(result!);
    const after = new Date();
    expect(parsed.getTime()).toBeGreaterThanOrEqual(before.getTime() - 1000);
    expect(parsed.getTime()).toBeLessThanOrEqual(after.getTime() + 1000);
  });
});
