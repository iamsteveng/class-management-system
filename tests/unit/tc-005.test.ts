import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('TC-005 use node directive present in s3Ingestion.ts', () => {
  it('TC-005: first line of convex/s3Ingestion.ts is "use node";', () => {
    const filePath = path.resolve(__dirname, '../../convex/s3Ingestion.ts');
    const content = fs.readFileSync(filePath, 'utf-8');
    const firstLine = content.split('\n')[0].trim();
    expect(firstLine).toBe('"use node";');
  });
});
