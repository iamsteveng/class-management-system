import { test, expect } from '@playwright/test';

// TC-043: Regular admin does NOT see the "Cancel (Rain)" button
// Targets: feat/rain-cancellation-change-session branch (localhost:3000)
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

test('TC-043: Regular admin (regular_admin role) does not see the Cancel (Rain) button', async ({ page }) => {
  const testId = Date.now();

  // Step 1: Create a class with a scheduled session
  const cls = await convexMutation('adminClasses:createClass', {
    name_zh: `TC043 Class ${testId}`,
    description: 'Rain cancel role gate test',
    admin_username: 'admin',
  }) as { class_id: string };

  await convexMutation('adminSessions:createSession', {
    class_id: cls.class_id,
    location_zh: `TC043-Session-${testId}`,
    date: '2030-08-15',
    time: '10:00',
    quota_defined: 10,
    admin_username: 'admin',
  });

  // Step 2: Login as regular_admin (staff/staff123)
  await page.goto(`${BASE_URL}/admin/login`);
  await page.getByLabel('Username').fill('staff');
  await page.getByLabel('Password').fill('staff123');
  await page.getByRole('button', { name: 'Sign In' }).click();
  await page.waitForURL(/\/admin\/(?!login)/, { timeout: 20_000 });

  // Step 3: Navigate to the class sessions page
  await page.goto(`${BASE_URL}/admin/classes/${cls.class_id}/sessions`);
  await page.waitForLoadState('networkidle');

  // Step 4: Assert the session row is visible (regular admin CAN view sessions)
  const sessionRow = page.locator('tr').filter({ hasText: `TC043-Session-${testId}` });
  await expect(sessionRow).toBeVisible({ timeout: 10_000 });

  // Step 5: Assert "Cancel (Rain)" button is NOT present anywhere on the page
  // The entire Actions column is gated by isSuperAdmin, so regular admins see no action buttons
  await expect(page.getByRole('button', { name: 'Cancel (Rain)' })).toHaveCount(0);

  await page.screenshot({ path: 'tc043-evidence.png', fullPage: true });

  console.log('TC-043 evidence:', JSON.stringify({
    class_id: cls.class_id,
    logged_in_as: 'staff (regular_admin)',
    rain_cancel_button_count: 0,
  }, null, 2));
});
