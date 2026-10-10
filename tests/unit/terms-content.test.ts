import { describe, it, expect, vi } from 'vitest';
import fs from 'fs';
import path from 'path';

vi.mock('convex/server', () => ({
  queryGeneric: (def: any) => def,
  mutationGeneric: (def: any) => def,
  actionGeneric: (def: any) => def,
  internalQueryGeneric: (def: any) => def,
  internalMutationGeneric: (def: any) => def,
  internalActionGeneric: (def: any) => def,
  makeFunctionReference: (name: string) => name,
}));
vi.mock('convex/values', () => {
  const noop = (..._args: any[]): any => 'schema';
  return { v: new Proxy({} as any, { get: () => noop }) };
});

import { parseTermsMarkdown } from '../../lib/termsText';
import { CYCLING_WAIVER_TEXT, CYCLING_WAIVER_VERSION } from '../../convex/termsContent';
import { publishTermsIfChanged } from '../../convex/termsPublish';
import { makeDb } from './helpers/fakeDb';

const markdown = fs.readFileSync(path.join(__dirname, '../../content/terms/cycling-waiver.md'), 'utf8');

describe('the cycling waiver', () => {
  it('is published exactly as content/terms/cycling-waiver.md says (run node scripts/build-terms.mjs)', () => {
    const parsed = parseTermsMarkdown(markdown);
    expect(CYCLING_WAIVER_VERSION).toBe(parsed.version);
    expect(CYCLING_WAIVER_TEXT).toBe(parsed.text);
  });

  it('is plain text with no Markdown left in it', () => {
    expect(CYCLING_WAIVER_TEXT).not.toMatch(/\*\*|^#|\\\.|<!--/m);
    expect(CYCLING_WAIVER_TEXT).toContain('・空氣質素健康指數達「甚高」或「嚴重」健康風險級別（只適用於幼兒班）。');
    expect(CYCLING_WAIVER_TEXT.startsWith('單車班 - 免責聲明書')).toBe(true);
  });
});

describe('publishTermsIfChanged', () => {
  it('publishes a new current version once, keeping earlier ones', async () => {
    const db = makeDb({
      terms_versions: [{ _id: 'old', version: '2026-03-31', content: 'old terms', is_current: true }],
      audit_logs: [],
    });
    const ctx = { db } as any;
    expect(await publishTermsIfChanged(ctx, { version: '2026-10-10', content: 'new terms' }, 1)).toBe(true);
    expect(db.tables.terms_versions.map((t: any) => [t.version, t.is_current])).toEqual([
      ['2026-03-31', false],
      ['2026-10-10', true],
    ]);
    expect(db.tables.terms_versions[0].content).toBe('old terms');
    expect(await publishTermsIfChanged(ctx, { version: '2026-10-10', content: 'new terms' }, 2)).toBe(false);
    expect(db.tables.terms_versions).toHaveLength(2);
  });
});
