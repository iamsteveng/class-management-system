import { test, expect } from '@playwright/test';
import path from 'path';

// TC-053: /apply/[class_id] shows "not available" message when the class has no airwallex_price.
// Uses route interception returning an empty classes list to simulate a non-Airwallex class.
const BASE_URL = 'http://localhost:3000';
const FAKE_CLASS_ID = 'tc053-nonexistent-class-id';

test.describe('TC-053: Apply page shows not-available for non-Airwallex class', () => {
  test('TC-053 /apply/[class_id] shows not-available message when class has no airwallex_price', async ({ page }) => {
    await page.route('**/api/classes', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ classes: [] }),
      });
    });

    await page.goto(`${BASE_URL}/apply/${FAKE_CLASS_ID}`);
    await page.waitForLoadState('networkidle');

    // Must show not-available message
    await expect(
      page.getByText('This class is not available for online payment.')
    ).toBeVisible({ timeout: 10_000 });

    // "Back to home" link must be visible
    await expect(page.getByRole('link', { name: 'Back to home' })).toBeVisible();

    // Pay button and mobile input must not be rendered
    await expect(page.getByRole('button', { name: /Pay/ })).toHaveCount(0);
    await expect(page.locator('input[type="tel"]')).toHaveCount(0);

    const screenshotDir = path.join(process.cwd(), 'test-results');
    await page.screenshot({ path: path.join(screenshotDir, 'tc-053-not-available.png'), fullPage: true });

    console.log('TC-053 evidence:', JSON.stringify({
      class_id: FAKE_CLASS_ID,
      not_available_message_shown: true,
      pay_button_absent: true,
    }, null, 2));
  });
});
