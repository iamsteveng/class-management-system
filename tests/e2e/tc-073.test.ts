import { test, expect } from '@playwright/test';

import { BASE_URL, createApplyFixture, fillValidDetails, mockCheckoutStart } from './helpers/applyFixture';

// TC-073: An Alipay HK QR code expires after 10 minutes and can be regenerated.

test.use({ viewport: { width: 1280, height: 800 } });

test('TC-073 Alipay HK QR expires after 10 minutes and regenerates', async ({ page }) => {
  const fx = await createApplyFixture(`TC073 Class ${Date.now()}`, { airwallex_price: 500 });
  try {
    await page.clock.install();
    await mockCheckoutStart(page);
    await page.route('**/api/payment/alipay-hk/start', (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ type: 'qrcode', qrcode: 'test-qr' }) })
    );
    await page.route('**/api/payment/alipay-hk/status**', (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ succeeded: false }) })
    );
    await page.goto(`${BASE_URL}/apply/${fx.classId}?session=${fx.sessionId}`);
    await fillValidDetails(page);
    await page.getByTestId('alipay-tab').click();
    await page.getByRole('button', { name: '確認並付款' }).click();
    await expect(page.locator('canvas')).toBeVisible({ timeout: 10_000 });

    await page.clock.fastForward(600_000 + 1_000);
    await expect(page.getByText('QR Code 已過期')).toBeVisible();
    await page.getByRole('button', { name: '重新生成' }).click();
    await expect(page.locator('canvas')).toBeVisible({ timeout: 10_000 });
  } finally {
    await fx.cleanup();
  }
});
