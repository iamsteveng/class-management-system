import { test, expect } from '@playwright/test';

const TOKEN = '291f596f-10ec-4b27-86a9-175153155ca8';

test('TC-008: Submit button disabled until terms checked', async ({ page }) => {
  await page.goto(`/terms?token=${TOKEN}`);
  await page.waitForLoadState('networkidle');

  // Select a session from the dropdown
  const select = page.locator('select#session_id');
  await expect(select).toBeVisible();
  const options = await select.locator('option').all();
  const availableOptions = await Promise.all(
    options.map(async (opt) => ({ value: await opt.getAttribute('value'), text: await opt.textContent() }))
  );
  const sessionOption = availableOptions.find(o => o.value && o.value.length > 0);
  expect(sessionOption, 'At least one session option must be available').toBeTruthy();
  await select.selectOption(sessionOption!.value!);

  // Do NOT check the terms checkbox
  const checkbox = page.locator('input[name="accepted"]');
  await expect(checkbox).not.toBeChecked();

  // Assert submit button is disabled
  const submitButton = page.locator('button[type="submit"]');
  await expect(submitButton).toBeDisabled();

  // Attempt to click the disabled button and verify form is not submitted
  await submitButton.click({ force: true });

  // Page should still be on the terms page (no navigation)
  expect(page.url()).toContain('/terms');

  // Button must still be disabled after click attempt
  await expect(submitButton).toBeDisabled();

  await page.screenshot({ path: 'e2e/tc008-screenshot.png', fullPage: true });
});
