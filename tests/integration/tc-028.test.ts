import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock convex/server so actionGeneric/mutationGeneric return plain definition objects,
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

// Use vi.hoisted() so these variables are available when the vi.mock factory is hoisted.
const {
  mockSend,
  MockS3Client,
  MockGetObjectCommand,
  MockCopyObjectCommand,
  MockDeleteObjectCommand,
  MockListObjectsV2Command,
} = vi.hoisted(() => {
  const mockSend = vi.fn();
  return {
    mockSend,
    // Must use regular function (not arrow) so it works as a `new` constructor
    // eslint-disable-next-line func-style
    MockS3Client: vi.fn().mockImplementation(function () { return { send: mockSend }; }),
    MockGetObjectCommand: vi.fn(),
    MockCopyObjectCommand: vi.fn(),
    MockDeleteObjectCommand: vi.fn(),
    MockListObjectsV2Command: vi.fn(),
  };
});

vi.mock('@aws-sdk/client-s3', () => ({
  S3Client: MockS3Client,
  GetObjectCommand: MockGetObjectCommand,
  CopyObjectCommand: MockCopyObjectCommand,
  DeleteObjectCommand: MockDeleteObjectCommand,
  ListObjectsV2Command: MockListObjectsV2Command,
}));

import { processS3File } from '../../convex/s3Ingestion';

// Minimal valid CSV — unknown product_id so no runMutation call needed
const MINIMAL_CSV =
  'order_id,product_id,user_phone,qty,unit_price,total\n' +
  'ORD-TC028-001,UNKNOWN_PROD,+6591234567,1,100.00,100.00\n';

describe('TC-028: Copy failure logged but polling continues', () => {
  let handler: (ctx: any, args: any) => Promise<any>;

  beforeEach(() => {
    vi.clearAllMocks();
    handler = (processS3File as any).handler;
  });

  it('TC-028: CopyObject failure is logged and processS3File resolves without throwing', async () => {
    const env = 'dev';
    const filename = '202603301200---tc028-test-uuid.csv';
    const fileKey = `${env}/new/${filename}`;
    const bucket = 'test-bucket-tc028';
    const copyError = new Error('S3 CopyObject AccessDenied');

    // GetObject succeeds; CopyObject throws; Delete should not be reached
    mockSend
      .mockResolvedValueOnce({
        Body: { transformToString: vi.fn().mockResolvedValue(MINIMAL_CSV) },
      })
      .mockRejectedValueOnce(copyError);

    const ctx = {
      runMutation: vi.fn().mockResolvedValue({ rows_inserted: 0, rows_skipped: 1 }),
    };

    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    let result: any;
    let threw = false;
    try {
      result = await handler(ctx, {
        file_key: fileKey,
        bucket,
        env,
        purchase_datetime: '2026-03-30T12:00:00',
      });
    } catch {
      threw = true;
    }

    // Action must NOT throw — polling continues on next tick
    expect(threw).toBe(false);

    // Must return a valid result object
    expect(result).toEqual(
      expect.objectContaining({
        rows_inserted: expect.any(Number),
        rows_skipped: expect.any(Number),
      })
    );

    // Error must be logged with the file paths
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      expect.stringContaining(fileKey)
    );
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      expect.stringContaining(copyError.message)
    );

    consoleErrorSpy.mockRestore();
  });

  it('TC-028: DeleteObject is NOT called when CopyObject fails', async () => {
    const env = 'prod';
    const filename = '202603301400---tc028-prod-uuid.csv';
    const fileKey = `${env}/new/${filename}`;
    const bucket = 'prod-bucket-tc028';

    mockSend
      .mockResolvedValueOnce({
        Body: { transformToString: vi.fn().mockResolvedValue(MINIMAL_CSV) },
      })
      .mockRejectedValueOnce(new Error('CopyObject network timeout'));

    const ctx = {
      runMutation: vi.fn().mockResolvedValue({ rows_inserted: 0, rows_skipped: 1 }),
    };

    vi.spyOn(console, 'error').mockImplementation(() => {});

    await handler(ctx, {
      file_key: fileKey,
      bucket,
      env,
      purchase_datetime: '2026-03-30T14:00:00',
    });

    // DeleteObjectCommand must NOT be called if CopyObjectCommand failed
    expect(MockDeleteObjectCommand).not.toHaveBeenCalled();

    vi.restoreAllMocks();
  });
});
