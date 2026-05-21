import { test, expect } from '@playwright/test';

// TC-059: Apply page — group price badge appears when qty >= group_min_qty;
// total price switches between individual and group tier correctly.
const KNOWN_CLASS_ID = '67261272-c799-4439-9146-4ee12ce51b7c';
const BASE_URL = 'http://localhost:3000';

test.describe('TC-059: Apply page tier pricing logic', () => {
  test('TC-059 individual price at qty=1, group badge + price at qty=2', async ({ page }) => {
    await page.route('**/api/classes**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          classes: [{
            class_id: KNOWN_CLASS_ID,
            name_zh: 'TC059 Class',
            airwallex_price: 298,
            airwallex_currency: 'HKD',
            airwallex_group_price: 250,
            airwallex_group_min_qty: 2,
          }],
        }),
      });
    });

    await page.goto(`${BASE_URL}/apply/${KNOWN_CLASS_ID}`);
    await page.waitForLoadState('networkidle');

    // qty=1: total = HKD 298, no group badge
    await expect(page.getByText('HKD 298')).toBeVisible({ timeout: 10_000 });
    await expect(page.locator('span.bg-emerald-100')).toHaveCount(0);

    // Increment to qty=2 → group tier kicks in
    await page.getByRole('button', { name: '+' }).click();

    // Total = 250 × 2 = 500
    await expect(page.getByText('HKD 500')).toBeVisible();

    // Group badge visible
    await expect(page.locator('span.bg-emerald-100')).toBeVisible();

    console.log('TC-059 evidence:', JSON.stringify({
      qty1_total: 298, qty2_total: 500, group_badge_at_qty2: true,
    }));
  });
});
