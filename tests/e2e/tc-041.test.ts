import { test, expect } from '@playwright/test';

// TC-041: Super admin sees "Cancel (Rain)" button only on scheduled sessions
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

test('TC-041: Super admin sees "Cancel (Rain)" button only on scheduled sessions, not on cancelled ones', async ({ page }) => {
  const testId = Date.now();

  // Step 1: Create a class with one scheduled and one cancelled session
  const cls = await convexMutation('adminClasses:createClass', {
    name_zh: `TC041 Class ${testId}`,
    description: 'Rain cancel button visibility test',
    admin_username: 'admin',
  }) as { class_id: string };

  const scheduledSession = await convexMutation('adminSessions:createSession', {
    class_id: cls.class_id,
    location_zh: `TC041-Scheduled-${testId}`,
    date: '2030-06-15',
    time: '09:00',
    quota_defined: 10,
    admin_username: 'admin',
  }) as { session_id: string };

  const toBeCalledSession = await convexMutation('adminSessions:createSession', {
    class_id: cls.class_id,
    location_zh: `TC041-ToBeCancelled-${testId}`,
    date: '2030-06-20',
    time: '10:00',
    quota_defined: 10,
    admin_username: 'admin',
  }) as { session_id: string };

  await convexMutation('adminSessions:cancelSession', {
    session_id: toBeCalledSession.session_id,
    admin_username: 'admin',
  });

  // Step 2: Login as super_admin
  await page.goto(`${BASE_URL}/admin/login`);
  await page.getByLabel('Username').fill('admin');
  await page.getByLabel('Password').fill('admin123');
  await page.getByRole('button', { name: 'Sign In' }).click();
  await page.waitForURL(/\/admin\/(?!login)/, { timeout: 20_000 });

  // Step 3: Navigate to the class sessions page
  await page.goto(`${BASE_URL}/admin/classes/${cls.class_id}/sessions`);
  await page.waitForLoadState('networkidle');

  // Step 4: Assert "Cancel (Rain)" button is visible on the scheduled session row
  const scheduledRow = page.locator('tr').filter({ hasText: `TC041-Scheduled-${testId}` });
  await expect(scheduledRow).toBeVisible({ timeout: 10_000 });
  const rainButtonOnScheduled = scheduledRow.getByRole('button', { name: 'Cancel (Rain)' });
  await expect(rainButtonOnScheduled).toBeVisible();

  // Step 5: Assert "Cancel (Rain)" button is NOT on the cancelled session row
  const cancelledRow = page.locator('tr').filter({ hasText: `TC041-ToBeCancelled-${testId}` });
  await expect(cancelledRow).toBeVisible();
  const rainButtonOnCancelled = cancelledRow.getByRole('button', { name: 'Cancel (Rain)' });
  await expect(rainButtonOnCancelled).toHaveCount(0);

  await page.screenshot({ path: 'tc041-evidence.png', fullPage: true });

  console.log('TC-041 evidence:', JSON.stringify({
    class_id: cls.class_id,
    scheduled_session_id: scheduledSession.session_id,
    cancelled_session_id: toBeCalledSession.session_id,
    rain_button_on_scheduled: true,
    rain_button_on_cancelled: false,
  }, null, 2));
});
