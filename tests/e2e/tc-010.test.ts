import { test, expect } from '@playwright/test';
import path from 'path';

const CONVEX_URL = 'https://colorless-raven-523.convex.cloud';
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

test.describe('TC-010: Admin session list — "View Participants" button navigates correctly', () => {
  test('TC-010 clicking View Participants navigates to /admin/sessions/<session_id>/participants', async ({ page }) => {
    const testId = Date.now();

    // Step 1: Create a class via Convex
    const createdClass = await convexMutation('adminClasses:createClass', {
      name: `TC010 Class ${testId}`,
      description: 'View Participants navigation test',
      admin_username: 'admin',
    }) as { class_id: string };

    // Step 2: Create a session via Convex
    const createdSession = await convexMutation('adminSessions:createSession', {
      class_id: createdClass.class_id,
      location: `TC010 Studio ${testId}`,
      date: '2030-12-25',
      time: '09:00',
      quota_defined: 10,
      admin_username: 'admin',
    }) as { session_id: string };

    // Step 3: Log in as admin
    await page.goto(`${BASE_URL}/admin/login`);
    await page.getByLabel('Username').fill('admin');
    await page.getByLabel('Password').fill('admin123');
    await page.getByRole('button', { name: 'Sign In' }).click();
    await page.waitForURL(/\/admin\/dashboard/, { timeout: 20_000 });

    // Step 4: Navigate to the class sessions page (where "View Participants" button lives)
    await page.goto(`${BASE_URL}/admin/classes/${createdClass.class_id}/sessions`);
    await page.waitForLoadState('networkidle');

    // Step 5: Locate the session row and click "View Participants"
    const sessionRow = page.locator('tbody tr').filter({ hasText: `TC010 Studio ${testId}` });
    await expect(sessionRow).toHaveCount(1, { timeout: 10_000 });
    await sessionRow.getByRole('link', { name: 'View Participants' }).click();

    // Step 6: Assert URL navigated to /admin/sessions/<session_id>/participants
    await page.waitForURL(/\/admin\/sessions\/.*\/participants/, { timeout: 20_000 });
    const currentUrl = page.url();
    expect(currentUrl).toContain(`/admin/sessions/${createdSession.session_id}/participants`);

    // Step 7: Assert participant list page heading is visible
    const heading = page.getByRole('heading', { name: 'Session Participants' });
    await expect(heading).toBeVisible({ timeout: 15_000 });

    // Screenshot evidence
    const screenshotDir = path.join(process.cwd(), 'test-results');
    await page.screenshot({ path: path.join(screenshotDir, 'tc-010-participants-page.png'), fullPage: true });

    console.log('TC-010 evidence:', JSON.stringify({
      class_id: createdClass.class_id,
      session_id: createdSession.session_id,
      final_url: currentUrl,
      heading_visible: true,
    }, null, 2));
  });
});
