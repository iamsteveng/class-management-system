import { test, expect } from '@playwright/test';
import path from 'path';

// TC-068: Desktop apply page renders QR code element after selecting Alipay HK.
const KNOWN_CLASS_ID = '67261272-c799-4439-9146-4ee12ce51b7c';
const BASE_URL = 'http://localhost:3000';

test.use({ viewport: { width: 1280, height: 800 } });

test.describe('TC-068: Desktop apply page renders QR code after selecting Alipay HK', () => {
  test('TC-068 QR code canvas appears after selecting Alipay HK tab on desktop', async ({ page }) => {
    await page.route('**/api/classes**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          classes: [{
            class_id: KNOWN_CLASS_ID,
            name_zh: 'TC068 Test Class',
            airwallex_price: 500,
            airwallex_currency: 'HKD',
          }],
        }),
      });
    });
    await page.route(`**/api/classes/${KNOWN_CLASS_ID}/sessions`, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ sessions: [] }),
      });
    });
    await page.route('**/api/payment/create-intent', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          intent_id: 'test-intent-068',
          client_secret: 'test-secret',
          amount: 500,
          currency: 'HKD',
        }),
      });
    });
    await page.route('**/api/payment/alipay-hk/start', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ type: 'qrcode', qrcode: 'test-qr-string' }),
      });
    });

    await page.goto(`${BASE_URL}/apply/${KNOWN_CLASS_ID}`);
    // Don't use networkidle — Airwallex SDK keeps network active indefinitely

    // Click the Alipay HK tab
    const alipayTab = page.getByRole('button', { name: /Alipay HK|支付寶HK/i });
    await expect(alipayTab).toBeVisible({ timeout: 15_000 });
    await alipayTab.click();

    // Fill in WhatsApp number
    const mobileInput = page.locator('input[type="tel"], input[name*="mobile"], input[placeholder*="WhatsApp"]').first();
    await mobileInput.fill('+85291234567');

    // Click Pay button (Alipay section — enabled without cardReady)
    const payButton = page.locator('button:not([disabled])').filter({ hasText: /Pay|付款/i }).first();
    await expect(payButton).toBeVisible({ timeout: 5_000 });
    await payButton.click();

    // Wait for QR code canvas to appear
    const canvas = page.locator('#alipay-qr-container canvas, canvas').first();
    await expect(canvas).toBeVisible({ timeout: 10_000 });

    // Card container should not be visible when Alipay tab is active
    await expect(page.locator('#airwallex-card-container')).not.toBeVisible();

    const screenshotDir = path.join(process.cwd(), 'test-results');
    await page.screenshot({ path: path.join(screenshotDir, 'tc-068-qr-code.png'), fullPage: true });

    console.log('TC-068 evidence:', JSON.stringify({
      alipay_tab_clicked: true,
      canvas_visible: true,
      card_container_hidden: true,
    }));
  });
});
