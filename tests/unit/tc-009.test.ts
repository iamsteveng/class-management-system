import { describe, it, expect } from 'vitest';
import { resolveClassId, productMapping } from '../../convex/productMapping';

describe('TC-009 resolveClassId returns correct class_id for known product', () => {
  it('TC-009: returns class_dev_001 for product "3" in dev env with custom mapping', () => {
    // Temporarily add a test entry to the dev mapping
    const originalDev = { ...productMapping.dev };
    productMapping.dev['3'] = 'class_dev_001';

    try {
      const result = resolveClassId('dev', '3');
      expect(result).toBe('class_dev_001');
    } finally {
      // Restore original mapping
      Object.keys(productMapping.dev).forEach(k => delete productMapping.dev[k]);
      Object.assign(productMapping.dev, originalDev);
    }
  });
});
