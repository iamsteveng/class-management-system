import { test, expect } from '@playwright/test';

import { BASE_URL, createApplyFixture } from './helpers/applyFixture';

// TC-053: A Class that is not on sale (no price, not free) cannot be booked.

test('TC-053 apply page shows not-available for a Class with no price', async ({ page }) => {
  const fx = await createApplyFixture(`TC053 Class ${Date.now()}`, {});
  try {
    await page.goto(`${BASE_URL}/apply/${fx.classId}`);
    await expect(page.getByText('此課程暫時未能報名。', { exact: false })).toBeVisible();
    await expect(page.getByRole('link', { name: /返回主頁/ })).toBeVisible();
    await expect(page.getByRole('button', { name: /付款|Pay/ })).toHaveCount(0);
    await expect(page.locator('input[type="tel"]')).toHaveCount(0);
  } finally {
    await fx.cleanup();
  }
});
