import { test, expect } from '@playwright/test';

import { BASE_URL, createApplyFixture, fillValidDetails, mockCheckoutStart } from './helpers/applyFixture';

// TC-069: On a phone, paying with Alipay HK goes straight to Alipay.

test.use({
  viewport: { width: 390, height: 844 },
  userAgent:
    'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.0 Mobile/15E148 Safari/604.1',
});

test('TC-069 Alipay HK on mobile redirects to Alipay', async ({ page }) => {
  const fx = await createApplyFixture(`TC069 Class ${Date.now()}`, { airwallex_price: 500 });
  try {
    await mockCheckoutStart(page);
    let returnUrl = '';
    await page.route('**/api/payment/alipay-hk/start', async (route) => {
      returnUrl = (route.request().postDataJSON() as { return_url: string }).return_url;
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ type: 'redirect', url: 'https://mock-alipay-hk.example.com/pay' }),
      });
    });
    await page.route('https://mock-alipay-hk.example.com/**', (route) =>
      route.fulfill({ status: 200, contentType: 'text/html', body: '<p>Alipay</p>' })
    );
    await page.goto(`${BASE_URL}/apply/${fx.classId}?session=${fx.sessionId}`);
    await fillValidDetails(page);
    await page.getByTestId('alipay-tab').click();
    await page.getByRole('button', { name: '確認並付款' }).click();
    await page.waitForURL('https://mock-alipay-hk.example.com/pay', { timeout: 10_000 });
    // Coming back lands on the return page for this booking
    expect(returnUrl).toContain(`/apply/${fx.classId}/alipay-return?intent_id=int_test&hold_id=hold-test`);
  } finally {
    await fx.cleanup();
  }
});
