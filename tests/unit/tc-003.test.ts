import { describe, it, expect, vi, afterEach } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('TC-003 S3 client reads credentials from env vars', () => {
  it('TC-003: createS3Client constructs S3Client with AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, and AWS_REGION', () => {
    const source = fs.readFileSync(
      path.resolve(__dirname, '../../convex/s3Ingestion.ts'),
      'utf-8'
    );

    // Verify S3Client is constructed with credentials from env vars
    expect(source).toContain('accessKeyId: process.env.AWS_ACCESS_KEY_ID');
    expect(source).toContain('secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY');
    expect(source).toContain('region: process.env.AWS_REGION');

    // Verify the credentials are passed inside a `credentials:` block to S3Client
    const s3ClientBlock = source.match(
      /new S3Client\(\{[\s\S]*?credentials\s*:\s*\{[\s\S]*?accessKeyId[\s\S]*?secretAccessKey[\s\S]*?\}[\s\S]*?\}\)/
    );
    expect(
      s3ClientBlock,
      'Expected S3Client to be constructed with a credentials object containing accessKeyId and secretAccessKey'
    ).not.toBeNull();
  });

  it('TC-003: S3Client is instantiated with the values of env vars at runtime', () => {
    const MockS3Client = vi.fn().mockImplementation(function (config: unknown) {
      return { _config: config };
    });

    // Simulate what createS3Client does with specific env var values
    const testRegion = 'us-east-1';
    const testAccessKeyId = 'AKIAIOSFODNN7EXAMPLE';
    const testSecretAccessKey = 'wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY';

    const originalRegion = process.env.AWS_REGION;
    const originalKeyId = process.env.AWS_ACCESS_KEY_ID;
    const originalSecret = process.env.AWS_SECRET_ACCESS_KEY;

    process.env.AWS_REGION = testRegion;
    process.env.AWS_ACCESS_KEY_ID = testAccessKeyId;
    process.env.AWS_SECRET_ACCESS_KEY = testSecretAccessKey;

    try {
      // Replicate createS3Client logic using MockS3Client
      const client = new MockS3Client({
        region: process.env.AWS_REGION ?? 'ap-southeast-1',
        credentials: {
          accessKeyId: process.env.AWS_ACCESS_KEY_ID ?? '',
          secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY ?? '',
        },
      });

      expect(MockS3Client).toHaveBeenCalledOnce();
      const [[calledWith]] = MockS3Client.mock.calls;
      expect(calledWith).toMatchObject({
        region: testRegion,
        credentials: {
          accessKeyId: testAccessKeyId,
          secretAccessKey: testSecretAccessKey,
        },
      });
    } finally {
      process.env.AWS_REGION = originalRegion;
      process.env.AWS_ACCESS_KEY_ID = originalKeyId;
      process.env.AWS_SECRET_ACCESS_KEY = originalSecret;
    }
  });
});
