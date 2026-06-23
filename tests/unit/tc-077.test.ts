import { describe, it, expect } from 'vitest';

// TC-077: Verify that the purchases.source field union does NOT include "alipayhk"
// and DOES include "airwallex" — so existing refund logic covers Alipay HK without changes.

describe('TC-077: Alipay HK purchase source stored as "airwallex"', () => {
  it('TC-077 convex schema source union contains "airwallex" and not "alipayhk"', async () => {
    const fs = await import('fs');
    const path = await import('path');
    const schemaPath = path.resolve(__dirname, '../../convex/schema.ts');
    const schemaContent = fs.readFileSync(schemaPath, 'utf-8');

    // Assert "airwallex" is in the source union
    expect(schemaContent).toContain('"airwallex"');

    // Assert "alipayhk" is NOT in the source union (Alipay HK uses source="airwallex")
    expect(schemaContent).not.toContain('"alipayhk"');

    // Assert the source union uses v.literal("airwallex")
    expect(schemaContent).toContain('v.literal("airwallex")');
    expect(schemaContent).not.toContain('v.literal("alipayhk")');

    console.log('TC-077 evidence: schema contains airwallex literal, does not contain alipayhk literal');
  });
});
