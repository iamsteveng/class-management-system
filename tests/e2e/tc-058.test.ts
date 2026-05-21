import { test, expect } from '@playwright/test';

// TC-058: Apply page — quantity selector defaults to 1, respects min=1 and max=15.
const KNOWN_CLASS_ID = '67261272-c799-4439-9146-4ee12ce51b7c';
const BASE_URL = 'http://localhost:3000';

test.describe('TC-058: Apply page quantity selector', () => {
  test('TC-058 quantity defaults to 1, increments up to 15, decrements down to 1', async ({ page }) => {
    await page.route('**/api/classes**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          classes: [{ class_id: KNOWN_CLASS_ID, name_zh: 'TC058 Class', airwallex_price: 298, airwallex_currency: 'HKD' }],
        }),
      });
    });

    await page.goto(`${BASE_URL}/apply/${KNOWN_CLASS_ID}`);
    await page.waitForLoadState('networkidle');

    // Default quantity is 1
    const quantityDisplay = page.locator('span.text-center.font-semibold');
    await expect(quantityDisplay).toHaveText('1', { timeout: 10_000 });

    // Decrement at 1 should be disabled
    const decrementBtn = page.getByRole('button', { name: '−' });
    await expect(decrementBtn).toBeDisabled();

    // Increment twice → quantity = 3
    const incrementBtn = page.getByRole('button', { name: '+' });
    await incrementBtn.click();
    await incrementBtn.click();
    await expect(quantityDisplay).toHaveText('3');

    // Increment to 15 (12 more clicks)
    for (let i = 0; i < 12; i++) await incrementBtn.click();
    await expect(quantityDisplay).toHaveText('15');

    // Increment at 15 should be disabled
    await expect(incrementBtn).toBeDisabled();

    // Decrement once → 14
    await decrementBtn.click();
    await expect(quantityDisplay).toHaveText('14');

    console.log('TC-058 evidence:', JSON.stringify({ default: 1, max_reached: 15, min_disabled: true }));
  });
});
