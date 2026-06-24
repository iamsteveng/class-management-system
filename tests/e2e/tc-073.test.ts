import { test, expect } from '@playwright/test';
import path from 'path';

// TC-073: QR code expiry countdown and Regenerate button.
const KNOWN_CLASS_ID = '67261272-c799-4439-9146-4ee12ce51b7c';
const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

test.describe('TC-073: QR code expiry and Regenerate button', () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test('TC-073 QR code shows expired message and Regenerate button after 10 minutes', async ({ page }) => {
    // Use Playwright fake timers
    await page.clock.install();

    // Mock API routes
    await page.route('**/api/classes**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          classes: [{
            class_id: KNOWN_CLASS_ID,
            name_zh: 'TC073 Class',
            airwallex_price: 500,
            airwallex_currency: 'HKD',
          }],
        }),
      });
    });

    await page.route('**/api/payment/create-intent', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          intent_id: 'test-intent-073',
          client_secret: 'test-secret',
          amount: 500,
          currency: 'HKD',
        }),
      });
    });

    // Mock start to return QR code
    let startCallCount = 0;
    await page.route('**/api/payment/alipay-hk/start', async (route) => {
      startCallCount++;
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ type: 'qrcode', qrcode: `test-qr-${startCallCount}` }),
      });
    });

    await page.goto(`${BASE_URL}/apply/${KNOWN_CLASS_ID}`);

    // Click Alipay HK tab
    await page.getByRole('button', { name: /Alipay HK|支付寶HK/i }).click();

    // Enter mobile
    await page.locator('input[type="tel"]').fill('+85291234567');

    // Find the enabled pay button
    const payBtn = page.getByRole('button', { name: /Pay|付款/i }).filter({ hasNot: page.locator('[disabled]') }).first();
    await payBtn.click();

    // Wait for canvas to appear (QR code displayed)
    await expect(page.locator('canvas')).toBeVisible({ timeout: 10_000 });

    // Advance clock by 10 minutes + 1 second
    await page.clock.fastForward(600_000 + 1_000);

    // Wait for expiry message
    const expiredMsg = page.locator('text=/過期|expired/i');
    await expect(expiredMsg).toBeVisible({ timeout: 5_000 });

    // Assert Regenerate button is visible
    const regenerateBtn = page.getByRole('button', { name: /重新生成|Regenerate/i });
    await expect(regenerateBtn).toBeVisible();

    // Click Regenerate and assert QR re-renders
    await regenerateBtn.click();
    await expect(page.locator('canvas')).toBeVisible({ timeout: 10_000 });

    console.log('TC-073 evidence: QR expired after 10min, Regenerate button clicked, QR re-rendered');
    await page.screenshot({
      path: path.join(process.cwd(), 'test-results', 'tc-073-qr-expired.png'),
      fullPage: true,
    });
  });
});
