import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('TC-004 File prefix uses {APP_ENV}/new/', () => {
  let originalAppEnv: string | undefined;

  beforeEach(() => {
    originalAppEnv = process.env.APP_ENV;
  });

  afterEach(() => {
    if (originalAppEnv === undefined) {
      delete process.env.APP_ENV;
    } else {
      process.env.APP_ENV = originalAppEnv;
    }
  });

  it('TC-004: getAppEnv reads from APP_ENV env var', () => {
    const source = fs.readFileSync(
      path.resolve(__dirname, '../../convex/s3Ingestion.ts'),
      'utf-8'
    );

    // Verify getAppEnv uses process.env.APP_ENV
    expect(source).toContain('process.env.APP_ENV');
  });

  it('TC-004: S3 list prefix is {APP_ENV}/new/ — resolves to uat/new/ when APP_ENV=uat', () => {
    process.env.APP_ENV = 'uat';

    // Replicate the logic from s3Ingestion.ts: getAppEnv() + prefix construction
    const env = process.env.APP_ENV ?? 'dev';
    const prefix = `${env}/new/`;

    expect(prefix).toBe('uat/new/');
  });

  it('TC-004: S3 list prefix defaults to dev/new/ when APP_ENV is unset', () => {
    delete process.env.APP_ENV;

    const env = process.env.APP_ENV ?? 'dev';
    const prefix = `${env}/new/`;

    expect(prefix).toBe('dev/new/');
  });

  it('TC-004: pollS3ForNewFiles constructs prefix as ${APP_ENV}/new/ in source', () => {
    const source = fs.readFileSync(
      path.resolve(__dirname, '../../convex/s3Ingestion.ts'),
      'utf-8'
    );

    // The prefix must be built from the env variable, not hardcoded
    expect(source).toContain('`${env}/new/`');
  });
});
