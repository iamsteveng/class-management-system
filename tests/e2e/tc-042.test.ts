import { test, expect } from '@playwright/test';

// TC-042: Clicking "Cancel (Rain)" marks session as cancelled (rain) — amber badge + success banner
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

test('TC-042: Cancel (Rain) button marks session as cancelled (rain), shows amber badge and success banner', async ({ page }) => {
  const testId = Date.now();

  // Step 1: Create a class and a scheduled session
  const cls = await convexMutation('adminClasses:createClass', {
    name_zh: `TC042 Class ${testId}`,
    description: 'Rain cancel flow test',
    admin_username: 'admin',
  }) as { class_id: string };

  const session = await convexMutation('adminSessions:createSession', {
    class_id: cls.class_id,
    location_zh: `TC042-Session-${testId}`,
    date: '2030-07-10',
    time: '09:00',
    quota_defined: 10,
    admin_username: 'admin',
  }) as { session_id: string };

  // Step 2: Login as super_admin
  await page.goto(`${BASE_URL}/admin/login`);
  await page.getByLabel('Username').fill('admin');
  await page.getByLabel('Password').fill('admin123');
  await page.getByRole('button', { name: 'Sign In' }).click();
  await page.waitForURL(/\/admin\/(?!login)/, { timeout: 20_000 });

  // Step 3: Navigate to sessions page
  await page.goto(`${BASE_URL}/admin/classes/${cls.class_id}/sessions`);
  await page.waitForLoadState('networkidle');

  // Step 4: Assert session row shows "scheduled" status badge before action
  const sessionRow = page.locator('tr').filter({ hasText: `TC042-Session-${testId}` });
  await expect(sessionRow).toBeVisible({ timeout: 10_000 });
  await expect(sessionRow.locator('span').filter({ hasText: 'scheduled' })).toBeVisible();

  // Step 5: Accept the window.confirm dialog automatically, then click "Cancel (Rain)"
  page.on('dialog', async (dialog) => {
    expect(dialog.message()).toContain('rain');
    await dialog.accept();
  });

  const rainButton = sessionRow.getByRole('button', { name: 'Cancel (Rain)' });
  await expect(rainButton).toBeVisible();
  await rainButton.click();

  // Step 6: Wait for redirect with session_rain_cancelled status
  await page.waitForURL(/status=session_rain_cancelled/, { timeout: 15_000 });
  await page.waitForLoadState('networkidle');

  // Step 7: Assert amber success banner appears
  const successBanner = page.locator('p').filter({ hasText: 'Session marked as rain-cancelled' });
  await expect(successBanner).toBeVisible({ timeout: 10_000 });

  // Step 8: Assert session row now shows "cancelled (rain)" amber badge
  const updatedRow = page.locator('tr').filter({ hasText: `TC042-Session-${testId}` });
  await expect(updatedRow).toBeVisible();
  const rainBadge = updatedRow.locator('span').filter({ hasText: 'cancelled (rain)' });
  await expect(rainBadge).toBeVisible();
  await expect(rainBadge).toHaveClass(/bg-amber-100/);

  // Step 9: Assert "Cancel (Rain)" button is no longer shown (session is no longer scheduled)
  await expect(updatedRow.getByRole('button', { name: 'Cancel (Rain)' })).toHaveCount(0);

  await page.screenshot({ path: 'tc042-evidence.png', fullPage: true });

  console.log('TC-042 evidence:', JSON.stringify({
    class_id: cls.class_id,
    session_id: session.session_id,
    amber_badge_visible: true,
    success_banner_visible: true,
    rain_button_gone_after_cancel: true,
  }, null, 2));
});
