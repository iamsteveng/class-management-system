import { test, expect } from '@playwright/test';
import path from 'path';

// TC-052: /apply/[class_id] renders the class name and price correctly.
// Uses route interception on /api/classes so no real Airwallex keys are needed.
const KNOWN_CLASS_ID = '67261272-c799-4439-9146-4ee12ce51b7c';
const BASE_URL = 'http://localhost:3000';

test.describe('TC-052: Apply page renders class name and price', () => {
  test('TC-052 /apply/[class_id] shows class name, price, mobile input, and Pay button', async ({ page }) => {
    const className = 'TC052 Test Class';
    const price = 1500;
    const currency = 'HKD';

    await page.route('**/api/classes', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          classes: [
            {
              class_id: KNOWN_CLASS_ID,
              name_zh: className,
              airwallex_price: price,
              airwallex_currency: currency,
            },
          ],
        }),
      });
    });

    await page.goto(`${BASE_URL}/apply/${KNOWN_CLASS_ID}`);
    await page.waitForLoadState('networkidle');

    // Class name heading
    await expect(page.getByRole('heading', { name: className })).toBeVisible({ timeout: 10_000 });

    // Price display: "HKD 1,500"
    await expect(page.getByText(`${currency} ${price.toLocaleString()}`)).toBeVisible();

    // WhatsApp mobile input
    await expect(page.locator('input[type="tel"]')).toBeVisible();

    // Pay button (disabled until card ready, but rendered)
    const payButton = page.getByRole('button', { name: /Pay HKD/ });
    await expect(payButton).toBeVisible();

    // Step indicator: Step 1 "Payment" active, Step 2 "Application Form" inactive
    await expect(page.getByText('Payment')).toBeVisible();
    await expect(page.getByText('Application Form')).toBeVisible();

    const screenshotDir = path.join(process.cwd(), 'test-results');
    await page.screenshot({ path: path.join(screenshotDir, 'tc-052-apply-page.png'), fullPage: true });

    console.log('TC-052 evidence:', JSON.stringify({
      class_id: KNOWN_CLASS_ID,
      class_name_visible: true,
      price_visible: `${currency} ${price.toLocaleString()}`,
      mobile_input_visible: true,
      pay_button_visible: true,
    }, null, 2));
  });
});
