import { test, expect } from '@playwright/test';

import { BASE_URL, createApplyFixture } from './helpers/applyFixture';

// TC-059: One person pays the single price; from the Group Price minimum, everyone pays the
// Group Price.

test('TC-059 single price at 1 person, Group Price from 2', async ({ page }) => {
  const fx = await createApplyFixture(`TC059 Class ${Date.now()}`, {
    airwallex_price: 298,
    airwallex_group_price: 250,
    airwallex_group_min_qty: 2,
    airwallex_currency: 'HKD',
  });
  try {
    await page.goto(`${BASE_URL}/apply/${fx.classId}?session=${fx.sessionId}`);
    await expect(page.getByTestId('total')).toHaveText('HKD 298');
    await page.getByRole('button', { name: '+' }).click();
    await expect(page.getByTestId('total')).toHaveText('HKD 500');
    await expect(page.getByText('已享同行價 HKD 250 / 人')).toBeVisible();
  } finally {
    await fx.cleanup();
  }
});
