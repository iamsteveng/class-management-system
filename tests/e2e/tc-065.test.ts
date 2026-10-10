import { test, expect } from '@playwright/test';

import { BASE_URL, createApplyFixture } from './helpers/applyFixture';

// TC-065: Choosing Alipay HK hides the card form; choosing card shows it again.

test('TC-065 Alipay HK tab toggles the card form', async ({ page }) => {
  const fx = await createApplyFixture(`TC065 Class ${Date.now()}`, { airwallex_price: 100 });
  try {
    await page.goto(`${BASE_URL}/apply/${fx.classId}?session=${fx.sessionId}`);
    const card = page.locator('#apply-card-container');
    await expect(card).toBeVisible();
    await page.getByTestId('alipay-tab').click();
    await expect(card).not.toBeVisible();
    await page.getByTestId('card-tab').click();
    await expect(card).toBeVisible();
  } finally {
    await fx.cleanup();
  }
});
