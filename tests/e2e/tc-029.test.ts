import { test, expect } from '@playwright/test';
import path from 'path';

const BASE_URL = 'http://localhost:3000';

test.describe('TC-029: Regular admin cannot add or edit FAQ items', () => {
  test('TC-029 regular admin sees FAQ page in view-only mode (no Add/Edit controls)', async ({ page }) => {
    const screenshotDir = path.join(process.cwd(), 'test-results');

    // Step 1: Log in as regular admin (staff role)
    await page.goto(`${BASE_URL}/admin/login`);
    await page.getByLabel('Username').fill('staff');
    await page.getByLabel('Password').fill('staff123');
    await page.getByRole('button', { name: 'Sign In' }).click();
    await page.waitForURL(/\/admin\/dashboard/, { timeout: 20_000 });
    console.log('TC-029: logged in as regular admin (staff)');

    // Step 2: Navigate to /admin/faq
    await page.goto(`${BASE_URL}/admin/faq`);
    await page.waitForLoadState('networkidle', { timeout: 20_000 });
    console.log('TC-029: navigated to /admin/faq');

    // Step 3: Assert page loads successfully
    await expect(page).toHaveURL(/\/admin\/faq/, { timeout: 10_000 });
    console.log('TC-029: FAQ page loaded successfully');

    // Step 4: Assert "Add FAQ" button is NOT present
    const addFaqButton = page.getByRole('button', { name: 'Add FAQ' });
    await expect(addFaqButton).toHaveCount(0);
    console.log('TC-029: "Add FAQ" button is not present — pass');

    // Step 5: Assert "Edit" buttons are NOT present
    const editButtons = page.getByRole('button', { name: 'Edit' });
    await expect(editButtons).toHaveCount(0);
    console.log('TC-029: "Edit" buttons are not present — pass');

    // Screenshot as evidence
    await page.screenshot({
      path: path.join(screenshotDir, 'tc-029-regular-admin-faq.png'),
      fullPage: true,
    });
    console.log('TC-029 evidence: screenshot saved — tc-029-regular-admin-faq.png');

    console.log('TC-029 PASS: regular admin sees FAQ page without Add/Edit controls');
  });
});
