import { test, expect } from '@playwright/test';
import path from 'path';

// TC-065: Alipay HK tab appears on apply page.
const KNOWN_CLASS_ID = '67261272-c799-4439-9146-4ee12ce51b7c';
const BASE_URL = 'http://localhost:3000';

test.describe('TC-065: Alipay HK tab appears on apply page', () => {
  test('TC-065 Alipay HK tab is visible and toggles card container visibility', async ({ page }) => {
    await page.route('**/api/classes**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          classes: [{
            class_id: KNOWN_CLASS_ID,
            name_zh: 'TC065 Test Class',
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

    await page.goto(`${BASE_URL}/apply/${KNOWN_CLASS_ID}`);
    // Don't use networkidle — Airwallex SDK keeps network active indefinitely
    // Assert Alipay HK tab is visible
    const alipayTab = page.getByRole('button', { name: /Alipay HK|支付寶HK/i });
    await expect(alipayTab).toBeVisible({ timeout: 15_000 });

    // Credit Card tab should be active by default — card container visible
    const cardContainer = page.locator('#airwallex-card-container');
    await expect(cardContainer).toBeVisible({ timeout: 10_000 });

    // Click Alipay HK tab
    await alipayTab.click();

    // After switching to Alipay tab, card container should NOT be visible
    await expect(cardContainer).not.toBeVisible({ timeout: 5_000 });

    const screenshotDir = path.join(process.cwd(), 'test-results');
    await page.screenshot({ path: path.join(screenshotDir, 'tc-065-alipay-tab.png'), fullPage: true });

    console.log('TC-065 evidence:', JSON.stringify({
      alipay_tab_visible: true,
      card_container_hidden_after_alipay_click: true,
    }));
  });
});
