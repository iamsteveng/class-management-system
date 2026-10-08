import { test, expect } from '@playwright/test';

import { BASE_URL, createApplyFixture, fillValidDetails, mockCheckoutStart } from './helpers/applyFixture';

// TC-068: On desktop, paying with Alipay HK shows a QR code to scan.

test.use({ viewport: { width: 1280, height: 800 } });

test('TC-068 Alipay HK on desktop shows a QR code', async ({ page }) => {
  const fx = await createApplyFixture(`TC068 Class ${Date.now()}`, { airwallex_price: 500 });
  try {
    await mockCheckoutStart(page);
    await page.route('**/api/payment/alipay-hk/start', (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ type: 'qrcode', qrcode: 'test-qr' }) })
    );
    await page.goto(`${BASE_URL}/apply/${fx.classId}?session=${fx.sessionId}`);
    await fillValidDetails(page);
    await page.getByTestId('alipay-tab').click();
    await page.getByRole('button', { name: '確認並付款' }).click();
    await expect(page.locator('canvas')).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText('用支付寶HK掃描付款')).toBeVisible();
    await expect(page.locator('#apply-card-container')).not.toBeVisible();
  } finally {
    await fx.cleanup();
  }
});
