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

test.describe('TC-012: Admin cancel session — blocked when participants are enrolled', () => {
  test('TC-012 cancel session with enrolled participants shows error and keeps status as scheduled', async ({ page }) => {
    const testId = Date.now();

    // Step 1: Create a class via Convex
    const createdClass = await convexMutation('adminClasses:createClass', {
      name: `TC012 Class ${testId}`,
      description: 'Cancel session block test',
      admin_username: 'admin',
    }) as { class_id: string };

    // Step 2: Create a session via Convex
    const createdSession = await convexMutation('adminSessions:createSession', {
      class_id: createdClass.class_id,
      location: `TC012 Studio ${testId}`,
      date: '2030-12-25',
      time: '10:00',
      quota_defined: 10,
      admin_username: 'admin',
    }) as { session_id: string };

    // Step 3: Enroll a participant in the session
    await convexMutation('testPurchase:createTestParticipant', {
      session_id: createdSession.session_id,
      name: `TC012 Tester ${testId}`,
      mobile: '+60123456789',
    });

    // Step 4: Log in as admin
    await page.goto(`${BASE_URL}/admin/login`);
    await page.getByLabel('Username').fill('admin');
    await page.getByLabel('Password').fill('admin123');
    await page.getByRole('button', { name: 'Sign In' }).click();
    await page.waitForURL(/\/admin\/dashboard/, { timeout: 20_000 });

    // Step 5: Navigate to the sessions page for the class
    await page.goto(`${BASE_URL}/admin/classes/${createdClass.class_id}/sessions`);
    await page.waitForLoadState('networkidle');

    // Step 6: Find the session row and assert initial status is "scheduled"
    const sessionRow = page.locator('tbody tr').filter({ hasText: `TC012 Studio ${testId}` });
    await expect(sessionRow).toHaveCount(1, { timeout: 15_000 });
    await expect(sessionRow.getByText('scheduled')).toBeVisible({ timeout: 10_000 });

    // Step 7: Accept the confirmation dialog and click Cancel
    page.on('dialog', async (dialog) => {
      await dialog.accept();
    });
    await sessionRow.getByRole('button', { name: 'Cancel' }).click();

    // Step 8: Wait for page to reload with error message
    await page.waitForLoadState('networkidle', { timeout: 30_000 });

    // Screenshot evidence
    const screenshotDir = path.join(process.cwd(), 'test-results');
    await page.screenshot({ path: path.join(screenshotDir, 'tc-012-cancel-blocked.png'), fullPage: true });

    // Step 9: Assert error message is shown indicating enrolled participants
    const errorMessage = page.locator('p.text-red-700');
    await expect(errorMessage).toBeVisible({ timeout: 15_000 });
    await expect(errorMessage).toContainText('enrolled participants');

    // Step 10: Assert session status is still "scheduled" (not "cancelled")
    const sessionRowAfter = page.locator('tbody tr').filter({ hasText: `TC012 Studio ${testId}` });
    await expect(sessionRowAfter.getByText('scheduled')).toBeVisible({ timeout: 10_000 });

    console.log('TC-012 evidence:', JSON.stringify({
      class_id: createdClass.class_id,
      session_id: createdSession.session_id,
      error_visible: true,
      session_status: 'scheduled',
    }, null, 2));
  });
});
