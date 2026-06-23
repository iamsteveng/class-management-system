import { test, expect } from '@playwright/test';

// TC-072: /apply/[class_id]/alipay-return shows error when intent has not succeeded.
const KNOWN_CLASS_ID = '67261272-c799-4439-9146-4ee12ce51b7c';
const BASE_URL = 'http://localhost:3000';

test.describe('TC-072: alipay-return shows error when payment not succeeded', () => {
  test('TC-072 alipay-return shows error when payment not succeeded', async ({ page }) => {
    await page.route('**/api/payment/alipay-hk/status**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ succeeded: false }),
      });
    });

    await page.goto(
      `${BASE_URL}/apply/${KNOWN_CLASS_ID}/alipay-return?intent_id=test-intent&mobile=%2B85291234567&quantity=1`
    );
    await page.waitForLoadState('networkidle');

    // Assert error message is visible (not redirected to passes)
    expect(page.url()).not.toContain('/passes');
    const errorMsg = page.locator('text=/未成功|not completed|try again/i');
    await expect(errorMsg).toBeVisible({ timeout: 10_000 });

    console.log('TC-072 evidence: error shown, no redirect to passes');
  });
});
