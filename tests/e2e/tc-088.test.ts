import { test, expect, devices } from '@playwright/test';

import { BASE_URL, fillTestCard } from './helpers/applyFixture';

// TC-088: On /apply the payment section only appears once a Session is picked. The card
// fields must work however long the Customer takes to pick (after the card form has
// loaded), and again after changing Session.

const { defaultBrowserType: _ignored, ...iphone } = devices['iPhone 13'];
test.use(iphone);

test('TC-088 card fields work when the Session is picked after the card form loads', async ({ page }) => {
  test.setTimeout(90_000);
  await page.goto(`${BASE_URL}/apply/class_cycling_kids`);
  await page.waitForTimeout(10_000); // the card form has loaded before anything is picked
  await page.locator('[data-session-id]:not([disabled])').first().click();
  await fillTestCard(page);
  await expect(page.frameLocator('#apply-card-number iframe').locator('input')).toHaveValue(/4035 5010 0000 0008/);

  // Changing Session brings the payment section back with working, empty card fields
  await page.getByRole('button', { name: '更改' }).click();
  await page.locator('[data-session-id]:not([disabled])').nth(1).click();
  await fillTestCard(page);
  await expect(page.frameLocator('#apply-card-cvc iframe').locator('input')).toHaveValue('123');
});
