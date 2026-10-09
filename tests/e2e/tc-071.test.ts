import { test, expect } from '@playwright/test';

// TC-071: Coming back from Alipay HK with a paid intent completes the booking and shows
// the done page.

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

test('TC-071 alipay-return completes the booking and goes to the done page', async ({ page }) => {
  await page.route('**/api/payment/alipay-hk/status**', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ succeeded: true }) })
  );
  let completed: unknown;
  await page.route('**/api/checkout/complete', async (route) => {
    completed = route.request().postDataJSON();
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ outcome: 'seated', order_id: 'int_test', participant_ids: ['p1'] }),
    });
  });

  await page.goto(`${BASE_URL}/apply/class_cycling_regular/alipay-return?intent_id=int_test&hold_id=hold-071&lang=zh-TW`);
  await page.waitForURL(/\/apply\/class_cycling_regular\/done\?hold=hold-071&lang=zh-TW/, { timeout: 15_000 });
  expect(completed).toEqual({ hold_id: 'hold-071', intent_id: 'int_test' });
});
