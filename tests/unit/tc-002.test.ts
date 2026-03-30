import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('TC-002 S3 polling cron registered at 5-minute interval', () => {
  it('TC-002: crons.ts registers s3Ingestion:pollS3ForNewFiles at { minutes: 5 }', () => {
    const cronsPath = path.resolve(__dirname, '../../convex/crons.ts');
    const source = fs.readFileSync(cronsPath, 'utf-8');

    // Assert the 5-minute interval is present
    expect(source).toContain('{ minutes: 5 }');

    // Assert it points to the correct function
    expect(source).toContain('s3Ingestion:pollS3ForNewFiles');

    // Assert both appear in the same crons.interval block (5-min interval is for S3)
    const s3BlockMatch = source.match(
      /crons\.interval\([^)]*poll S3[^)]*\{[^}]*minutes\s*:\s*5[^}]*\}[\s\S]*?s3Ingestion:pollS3ForNewFiles/
    );
    expect(s3BlockMatch, 'Expected a crons.interval block with minutes:5 for s3Ingestion:pollS3ForNewFiles').not.toBeNull();
  });
});
