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

test.describe('TC-006: Class listing defaults to Active filter on page load', () => {
  test('TC-006 filter dropdown shows Active as selected and only active classes are displayed', async ({ page }) => {
    const testId = Date.now();

    // Step 1: Create an active class
    const activeClass = await convexMutation('adminClasses:createClass', {
      name: `TC006 Active Class ${testId}`,
      description: 'TC-006 active class seed',
      admin_username: 'admin',
    }) as { class_id: string };

    // Step 2: Create a class and then cancel it (making it inactive)
    const inactiveClass = await convexMutation('adminClasses:createClass', {
      name: `TC006 Inactive Class ${testId}`,
      description: 'TC-006 inactive class seed',
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

    // Step 4: Navigate to class listing without any filter param
    await page.goto(`${BASE_URL}/admin/classes`);
    await page.waitForLoadState('networkidle');

    // Step 5: Verify the filter dropdown has 'active' selected
    const filterSelect = page.locator('#class-filter');
    await expect(filterSelect).toBeVisible({ timeout: 10_000 });
    await expect(filterSelect).toHaveValue('active');

    // Step 6: Verify the active class is visible in the listing
    const tableBody = page.locator('tbody');
    await expect(tableBody).toBeVisible({ timeout: 10_000 });

    const activeClassRow = tableBody.locator('tr').filter({ hasText: `TC006 Active Class ${testId}` });
    await expect(activeClassRow).toHaveCount(1, { timeout: 10_000 });

    // Step 7: Verify the inactive/cancelled class is NOT visible
    const inactiveClassRow = tableBody.locator('tr').filter({ hasText: `TC006 Inactive Class ${testId}` });
    await expect(inactiveClassRow).toHaveCount(0, { timeout: 5_000 });

    // Step 8: Take screenshot as evidence
    const screenshotDir = path.join(process.cwd(), 'test-results');
    await page.screenshot({ path: path.join(screenshotDir, 'tc-006-active-filter-default.png'), fullPage: true });

    // Count active rows for evidence
    const allRows = tableBody.locator('tr');
    const rowCount = await allRows.count();

    console.log('TC-006 evidence:', JSON.stringify({
      filter_dropdown_value: 'active',
      active_class_visible: true,
      inactive_class_visible: false,
      total_rows_shown: rowCount,
      active_class_id: activeClass.class_id,
      inactive_class_id: inactiveClass.class_id,
    }, null, 2));
  });
});
