import { test, expect } from '@playwright/test';
import path from 'path';

const CONVEX_URL = 'https://graceful-mole-393.convex.cloud';
const BASE_URL = 'http://localhost:3000';

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

test.describe('TC-007: Class listing filter can switch to Inactive and All', () => {
  test('TC-007 filter dropdown switches to Inactive then All and updates listing immediately', async ({ page }) => {
    const testId = Date.now();
    const screenshotDir = path.join(process.cwd(), 'test-results');

    // Step 1: Create an active class
    const activeClass = await convexMutation('adminClasses:createClass', {
      name_zh: `TC007 Active Class ${testId}`,
      description: 'TC-007 active class seed',
      admin_username: 'admin',
    }) as { class_id: string };

    // Step 2: Create a class and cancel it (making it inactive)
    const inactiveClass = await convexMutation('adminClasses:createClass', {
      name_zh: `TC007 Inactive Class ${testId}`,
      description: 'TC-007 inactive class seed',
      admin_username: 'admin',
    }) as { class_id: string };

    await convexMutation('adminClasses:cancelClass', {
      class_id: inactiveClass.class_id,
      admin_username: 'admin',
    });

    // Step 3: Log in as admin
    await page.goto(`${BASE_URL}/admin/login`);
    await page.getByLabel('Username').fill('admin');
    await page.getByLabel('Password').fill('admin123');
    await page.getByRole('button', { name: 'Sign In' }).click();
    await page.waitForURL(/\/admin\/dashboard/, { timeout: 20_000 });

    // Step 4: Navigate to class listing (default = active filter)
    await page.goto(`${BASE_URL}/admin/classes`);
    await page.waitForLoadState('networkidle');

    const filterSelect = page.locator('#class-filter');
    await expect(filterSelect).toBeVisible({ timeout: 10_000 });

    // --- Switch to Inactive ---
    await filterSelect.selectOption('inactive');
    await page.waitForLoadState('networkidle');

    // Verify URL updated
    await expect(page).toHaveURL(/filter=inactive/, { timeout: 10_000 });

    // Verify filter dropdown reflects selection
    await expect(filterSelect).toHaveValue('inactive');

    const tableBody = page.locator('tbody');
    await expect(tableBody).toBeVisible({ timeout: 10_000 });

    // Inactive class should be visible
    const inactiveRow = tableBody.locator('tr').filter({ hasText: `TC007 Inactive Class ${testId}` });
    await expect(inactiveRow).toHaveCount(1, { timeout: 10_000 });

    // Active class should NOT be visible
    const activeRowUnderInactive = tableBody.locator('tr').filter({ hasText: `TC007 Active Class ${testId}` });
    await expect(activeRowUnderInactive).toHaveCount(0, { timeout: 5_000 });

    // Screenshot: Inactive filter
    await page.screenshot({ path: path.join(screenshotDir, 'tc-007-inactive-filter.png'), fullPage: true });

    const inactiveRowCount = await tableBody.locator('tr').count();
    console.log('TC-007 Inactive filter evidence:', JSON.stringify({
      filter_value: 'inactive',
      inactive_class_visible: true,
      active_class_visible: false,
      total_rows_shown: inactiveRowCount,
    }, null, 2));

    // --- Switch to All ---
    await filterSelect.selectOption('all');
    await page.waitForLoadState('networkidle');

    // Verify URL updated
    await expect(page).toHaveURL(/filter=all/, { timeout: 10_000 });

    // Verify filter dropdown reflects selection
    await expect(filterSelect).toHaveValue('all');

    await expect(tableBody).toBeVisible({ timeout: 10_000 });

    // Both active and inactive classes should be visible
    const activeRowUnderAll = tableBody.locator('tr').filter({ hasText: `TC007 Active Class ${testId}` });
    await expect(activeRowUnderAll).toHaveCount(1, { timeout: 10_000 });

    const inactiveRowUnderAll = tableBody.locator('tr').filter({ hasText: `TC007 Inactive Class ${testId}` });
    await expect(inactiveRowUnderAll).toHaveCount(1, { timeout: 10_000 });

    // Screenshot: All filter
    await page.screenshot({ path: path.join(screenshotDir, 'tc-007-all-filter.png'), fullPage: true });

    const allRowCount = await tableBody.locator('tr').count();
    console.log('TC-007 All filter evidence:', JSON.stringify({
      filter_value: 'all',
      active_class_visible: true,
      inactive_class_visible: true,
      total_rows_shown: allRowCount,
    }, null, 2));
  });
});
