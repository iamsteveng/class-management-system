import { test, expect } from '@playwright/test';

// TC-069: Mobile apply page redirects to Alipay HK URL.
const KNOWN_CLASS_ID = '67261272-c799-4439-9146-4ee12ce51b7c';
const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

test.use({
  viewport: { width: 390, height: 844 },
  userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.0 Mobile/15E148 Safari/604.1',
});

test.describe('TC-069: Mobile apply page redirects to Alipay HK URL', () => {
  test('TC-069 clicking Pay on mobile triggers redirect to Alipay HK URL', async ({ page }) => {
    await page.route('**/api/classes**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          classes: [{
            class_id: KNOWN_CLASS_ID,
            name_zh: 'TC069 Test Class',
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
          intent_id: 'test-intent-069',
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
        body: JSON.stringify({ type: 'redirect', url: 'https://mock-alipay-hk.example.com/pay' }),
      });
    });
    // Intercept the navigation to the mock URL so DNS resolution doesn't fail
    await page.route('https://mock-alipay-hk.example.com/**', async (route) => {
      await route.fulfill({ status: 200, contentType: 'text/html', body: '<html><body>mock alipay</body></html>' });
    });

    await page.goto(`${BASE_URL}/apply/${KNOWN_CLASS_ID}`);
    // Don't use networkidle — Airwallex SDK loads background resources that prevent it from settling
    const alipayTab = page.getByRole('button', { name: /Alipay HK|支付寶HK/i });
    await expect(alipayTab).toBeVisible({ timeout: 15_000 });
    await alipayTab.click();

    // Fill in mobile number
    const mobileInput = page.locator('input[type="tel"], input[name*="mobile"], input[placeholder*="WhatsApp"]').first();
    await mobileInput.fill('+85291234567');

    // Click Pay button
    const payButton = page.locator('button:not([disabled])').filter({ hasText: /Pay|付款/i }).first();
    await expect(payButton).toBeVisible({ timeout: 5_000 });
    await payButton.click();

    // Assert page redirects to mock Alipay HK URL
    await page.waitForURL('https://mock-alipay-hk.example.com/pay', { timeout: 10_000 });
    expect(page.url()).toBe('https://mock-alipay-hk.example.com/pay');

    console.log('TC-069 evidence:', JSON.stringify({
      redirected_to: page.url(),
    }));
  });
});
