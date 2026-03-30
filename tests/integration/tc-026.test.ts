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

// Mock @aws-sdk/client-s3 — capture S3 command instantiations to assert call args.
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

// Minimal valid CSV (all required columns present; product_id unknown → row skipped → no runMutation call)
const MINIMAL_CSV =
  'order_id,product_id,user_phone,qty,unit_price,total\n' +
  'ORD-TC026-001,UNKNOWN_PROD,+6591234567,1,100.00,100.00\n';

describe('TC-026: Processed file copied to {ENV}/processed/', () => {
  let handler: (ctx: any, args: any) => Promise<any>;

  beforeEach(() => {
    vi.clearAllMocks();
    handler = (processS3File as any).handler;

    // First send() call = GetObjectCommand → returns CSV body
    // Subsequent calls (Copy, Delete) → return empty success response
    mockSend
      .mockResolvedValueOnce({
        Body: { transformToString: vi.fn().mockResolvedValue(MINIMAL_CSV) },
      })
      .mockResolvedValue({});
  });

  it('TC-026: CopyObjectCommand called with Key = {env}/processed/{filename}', async () => {
    const env = 'dev';
    const filename = '202603301200---tc026-test-uuid.csv';
    const fileKey = `${env}/new/${filename}`;
    const bucket = 'test-bucket-tc026';

    const ctx = {
      // No rows will be inserted (unknown product_id → skipped), so runMutation is not called.
      runMutation: vi.fn().mockResolvedValue({ rows_inserted: 0, rows_skipped: 1 }),
    };

    await handler(ctx, {
      file_key: fileKey,
      bucket,
      env,
      purchase_datetime: '2026-03-30T12:00:00',
    });

    // Primary pass criterion: CopyObjectCommand instantiated with the correct destination key
    expect(MockCopyObjectCommand).toHaveBeenCalledTimes(1);
    expect(MockCopyObjectCommand).toHaveBeenCalledWith({
      Bucket: bucket,
      CopySource: `${bucket}/${fileKey}`,
      Key: `${env}/processed/${filename}`,
    });

    // send() must have been called (GetObjectCommand + CopyObjectCommand + DeleteObjectCommand)
    expect(mockSend).toHaveBeenCalledTimes(3);
  });

  it('TC-026: processed key uses env-specific prefix for prod environment', async () => {
    const env = 'prod';
    const filename = '202603301400---tc026-prod-uuid.csv';
    const fileKey = `${env}/new/${filename}`;
    const bucket = 'prod-bucket-tc026';

    // Reset send mock for this test
    mockSend
      .mockResolvedValueOnce({
        Body: { transformToString: vi.fn().mockResolvedValue(MINIMAL_CSV) },
      })
      .mockResolvedValue({});

    const ctx = {
      runMutation: vi.fn().mockResolvedValue({ rows_inserted: 0, rows_skipped: 1 }),
    };

    await handler(ctx, {
      file_key: fileKey,
      bucket,
      env,
      purchase_datetime: '2026-03-30T14:00:00',
    });

    expect(MockCopyObjectCommand).toHaveBeenCalledWith({
      Bucket: bucket,
      CopySource: `${bucket}/${fileKey}`,
      Key: `${env}/processed/${filename}`,
    });
  });
});
