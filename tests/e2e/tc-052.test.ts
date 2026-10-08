import { test, expect } from '@playwright/test';

import { BASE_URL, createApplyFixture } from './helpers/applyFixture';

// TC-052: /apply/[class_id] shows the Class, the chosen Session, the price, the Customer's
// mobile and the pay button.

test('TC-052 apply page shows class, session, price, mobile input and pay button', async ({ page }) => {
  const fx = await createApplyFixture(`TC052 Class ${Date.now()}`, { airwallex_price: 1500, airwallex_currency: 'HKD' });
  try {
    await page.goto(`${BASE_URL}/apply/${fx.classId}?session=${fx.sessionId}`);
    await expect(page.getByText(/TC052 Class/).first()).toBeVisible();
    await expect(page.getByTestId('selected-session')).toContainText('11月1日');
    await expect(page.getByTestId('total')).toHaveText('HKD 1,500');
    await expect(page.locator('input[name="customer_mobile"]')).toBeVisible();
    await expect(page.getByRole('button', { name: '確認並付款' })).toBeVisible();
  } finally {
    await fx.cleanup();
  }
});
