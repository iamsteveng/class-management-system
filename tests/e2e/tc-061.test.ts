import { test, expect } from '@playwright/test';
import path from 'path';

// TC-061: Passes page EN language — shows "Copy Link" and "Fill Details",
// and the reminder banner is in English when lang=en.
const KNOWN_CLASS_ID = '67261272-c799-4439-9146-4ee12ce51b7c';
const BASE_URL = 'http://localhost:3000';

test.describe('TC-061: Passes page English language', () => {
  test('TC-061 passes page in English shows Copy Link and Fill Details buttons', async ({ page }) => {
    const tokens = ['bbbbbbbb-0001-0001-0001-000000000001', 'bbbbbbbb-0002-0002-0002-000000000002'];
    const mobile = '+85291234567';

    await page.goto(
      `${BASE_URL}/apply/${KNOWN_CLASS_ID}/passes?tokens=${tokens.join(',')}&mobile=${encodeURIComponent(mobile)}&lang=en`
    );
    await page.waitForLoadState('networkidle');

    // EN reminder banner
    await expect(page.getByText('The following links have been sent')).toBeVisible({ timeout: 10_000 });

    // EN button labels
    await expect(page.getByRole('button', { name: 'Copy Link' })).toHaveCount(2);
    await expect(page.getByRole('link', { name: 'Fill Details' })).toHaveCount(2);

    const screenshotDir = path.join(process.cwd(), 'test-results');
    await page.screenshot({ path: path.join(screenshotDir, 'tc-061-passes-en.png'), fullPage: true });

    console.log('TC-061 evidence:', JSON.stringify({ lang: 'en', card_count: 2 }));
  });
});
