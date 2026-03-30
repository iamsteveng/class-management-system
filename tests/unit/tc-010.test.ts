import { describe, it, expect } from 'vitest';
import { resolveClassId } from '../../convex/productMapping';

describe('TC-010 resolveClassId returns undefined for unknown product', () => {
  it('TC-010: returns undefined for product "999" not in dev mapping', () => {
    const result = resolveClassId('dev', '999');
    expect(result).toBeUndefined();
  });
});
