import { test, expect } from '@playwright/test';

import { convex } from './helpers/applyFixture';
import path from 'path';

// TC-064: Homepage Apply button text matches selected language.
// ZH mode → 立即報名, EN mode → Apply Now.
const KNOWN_CLASS_ID = '67261272-c799-4439-9146-4ee12ce51b7c';
const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

test.describe('TC-064: Homepage Apply button is bilingual', () => {
  test('TC-064 Apply button shows 立即報名 by default and Apply Now after switching to EN', async ({ page }) => {
    // Covers the old homepage, shown until the launch switch turns the cycling landing page on.
    const { live } = (await convex('query', 'landing:getLandingData', {})) as { live: boolean };
    test.skip(live, 'The cycling landing page is live on this deployment');
    await page.route('**/api/classes**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          classes: [{
            class_id: KNOWN_CLASS_ID,
            name_zh: 'TC064 Bilingual Class',
            sessions: [],
            airwallex_price: 298,
            airwallex_currency: 'HKD',
          }],
        }),
      });
    });
    await page.route(`**/api/classes/${KNOWN_CLASS_ID}/sessions`, async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ sessions: [] }) });
    });

    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');

    // Default ZH — button text 立即報名
    const applyLink = page.getByRole('link', { name: '立即報名' });
    await expect(applyLink).toBeVisible({ timeout: 15_000 });

    // Switch to EN via the language dropdown
    await page.getByRole('button', { name: '繁體' }).click();
    await page.getByRole('button', { name: 'English' }).click();

    // EN — button text Apply Now
    await expect(page.getByRole('link', { name: 'Apply Now' })).toBeVisible({ timeout: 5_000 });
    await expect(page.getByRole('link', { name: '立即報名' })).toHaveCount(0);

    const screenshotDir = path.join(process.cwd(), 'test-results');
    await page.screenshot({ path: path.join(screenshotDir, 'tc-064-bilingual-apply.png'), fullPage: true });

    console.log('TC-064 evidence:', JSON.stringify({
      zh_button: '立即報名', en_button: 'Apply Now',
    }));
  });
});
