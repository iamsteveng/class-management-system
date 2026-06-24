import { test, expect } from '@playwright/test';

// TC-071: /apply/[class_id]/alipay-return page creates purchases and redirects to passes.
const KNOWN_CLASS_ID = '67261272-c799-4439-9146-4ee12ce51b7c';
const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

test.describe('TC-071: alipay-return redirects to passes on success', () => {
  test('TC-071 alipay-return page redirects to passes on success', async ({ page }) => {
    // 1. Mock our status route
    await page.route('**/api/payment/alipay-hk/status**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ succeeded: true }),
      });
    });

    // 2. Mock confirm route
    await page.route('**/api/payment/confirm', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ tokens: ['tok-abc'] }),
      });
    });

    // 3. Navigate to alipay-return
    await page.goto(
      `${BASE_URL}/apply/${KNOWN_CLASS_ID}/alipay-return?intent_id=test-intent&mobile=%2B85291234567&quantity=1&lang=zh-TW`
    );

    // 4. Wait for redirect to passes page
    await page.waitForURL(/\/passes\?/, { timeout: 15_000 });

    // 5. Assert URL contains tok-abc, mobile, and lang
    expect(page.url()).toContain('tokens=tok-abc');
    expect(page.url()).toContain('mobile=');
    expect(page.url()).toContain('lang=zh-TW');

    console.log('TC-071 evidence:', { url: page.url() });
  });
});
