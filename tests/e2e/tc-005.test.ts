import { test, expect } from '@playwright/test';
import path from 'path';

const CONVEX_URL = 'https://graceful-mole-393.convex.cloud';
const BASE_URL = 'https://class-management-system-teal.vercel.app';

async function convexMutation(fnPath: string, args: Record<string, unknown>) {
  const res = await fetch(`${CONVEX_URL}/api/mutation`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ path: fnPath, args, format: 'json' }),
  });
  const json = await res.json() as { status: string; value?: unknown; errorMessage?: string };
  if (json.status !== 'success') throw new Error(`Mutation ${fnPath} failed: ${json.errorMessage}`);
  return json.value;
}

test.describe('TC-005: Regular admin does NOT see payment URL field', () => {
  test('TC-005 payment URL input is absent from class edit form for regular_admin', async ({ page }) => {
    // Step 1: Create a test class via Convex so there is at least one class in the list
    await convexMutation('adminClasses:createClass', {
      name: `TC005 RegularAdmin Class ${Date.now()}`,
      description: 'TC-005 payment URL visibility test for regular_admin',
      admin_username: 'admin',
    });

    // Step 2: Log in as regular_admin (staff / staff123)
    await page.goto(`${BASE_URL}/admin/login`);
    await page.getByLabel('Username').fill('staff');
    await page.getByLabel('Password').fill('staff123');
    await page.getByRole('button', { name: 'Sign In' }).click();
    await page.waitForURL(/\/admin\/dashboard/, { timeout: 20_000 });

    // Step 3: Navigate to the classes page
    await page.goto(`${BASE_URL}/admin/classes`);
    await page.waitForLoadState('networkidle');

    // Step 4: Screenshot evidence — shows the class list without Edit buttons
    const screenshotDir = path.join(process.cwd(), 'test-results');
    await page.screenshot({ path: path.join(screenshotDir, 'tc-005-regular-admin-classes.png'), fullPage: true });

    // Step 5: Assert that no Edit button is present (regular_admin cannot edit classes)
    const editButtons = page.getByRole('button', { name: 'Edit' });
    await expect(editButtons).toHaveCount(0, { timeout: 5_000 });

    // Step 6: Assert that no payment_url input is present on the page
    const paymentUrlInput = page.locator('input[name="payment_url"]');
    await expect(paymentUrlInput).toHaveCount(0);

    console.log('TC-005 evidence:', JSON.stringify({
      logged_in_as: 'staff (regular_admin)',
      edit_buttons_count: 0,
      payment_url_field_present: false,
    }, null, 2));
  });
});
