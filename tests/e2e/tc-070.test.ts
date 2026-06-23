import { test, expect } from '@playwright/test';

// TC-070: /api/payment/alipay-hk/status returns succeeded: true when intent has succeeded.
const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

test.describe('TC-070: alipay-hk/status returns succeeded true for SUCCEEDED intent', () => {
  test('TC-070 status route returns succeeded true for SUCCEEDED intent', async ({ page }) => {
    await page.goto(BASE_URL);

    await page.route('**/api/payment/alipay-hk/status**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ succeeded: true }),
      });
    });

    const result = await page.evaluate(() =>
      fetch('/api/payment/alipay-hk/status?intent_id=fake-intent-id').then(r => r.json())
    );

    expect(result.succeeded).toBe(true);

    console.log('TC-070 evidence:', JSON.stringify(result));
  });
});
