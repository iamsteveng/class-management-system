import { test, expect } from '@playwright/test';

import { BASE_URL, createApplyFixture } from './helpers/applyFixture';

// TC-058: The number of people starts at 1 and goes up to the Session's Remaining Quota,
// adding a participant form for each person.

test('TC-058 quantity is 1 to the Remaining Quota, one form per person', async ({ page }) => {
  const fx = await createApplyFixture(`TC058 Class ${Date.now()}`, { airwallex_price: 100 }, 3);
  try {
    await page.goto(`${BASE_URL}/apply/${fx.classId}?session=${fx.sessionId}`);
    const qty = page.getByTestId('quantity');
    const inc = page.getByRole('button', { name: '+' });
    const dec = page.getByRole('button', { name: '−' });
    await expect(qty).toHaveText('1');
    await expect(dec).toBeDisabled();
    await inc.click();
    await inc.click();
    await expect(qty).toHaveText('3');
    await expect(inc).toBeDisabled();
    await expect(page.locator('[data-participant]')).toHaveCount(3);
    await dec.click();
    await expect(qty).toHaveText('2');
    await expect(page.locator('[data-participant]')).toHaveCount(2);
  } finally {
    await fx.cleanup();
  }
});
