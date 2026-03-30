import { describe, it, expect } from 'vitest';
import { resolveClassId } from '../../convex/productMapping';

describe('TC-011 resolveClassId returns undefined for unknown environment', () => {
  it('TC-011: returns undefined for unknown environment "staging"', () => {
    const result = resolveClassId('staging', '3');
    expect(result).toBeUndefined();
  });
});
