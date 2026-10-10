import { test, expect } from '@playwright/test';

// TC-072: Coming back from Alipay HK without a successful payment shows an error and books
// nothing.

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

test('TC-072 alipay-return shows an error when the payment has not succeeded', async ({ page }) => {
  await page.route('**/api/payment/alipay-hk/status**', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ succeeded: false }) })
  );
  let completeCalled = false;
  await page.route('**/api/checkout/complete', async (route) => {
    completeCalled = true;
    await route.abort();
  });

  await page.goto(`${BASE_URL}/apply/class_cycling_regular/alipay-return?intent_id=int_test&hold_id=hold-072`);
  await expect(page.locator('text=/未成功|not completed|try again/i')).toBeVisible({ timeout: 10_000 });
  expect(page.url()).not.toContain('/done');
  expect(completeCalled).toBe(false);
});
