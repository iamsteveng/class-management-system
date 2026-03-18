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

test.describe('TC-014: Admin cancel session — error displayed inline (not raw browser alert)', () => {
  test('TC-014 cancel session with enrolled participants shows inline error, not window.alert', async ({ page }) => {
    const testId = Date.now();

    // Step 1: Create a class via Convex
    const createdClass = await convexMutation('adminClasses:createClass', {
      name: `TC014 Class ${testId}`,
      description: 'Cancel session inline error test',
      admin_username: 'admin',
    }) as { class_id: string };

    // Step 2: Create a session via Convex
    const createdSession = await convexMutation('adminSessions:createSession', {
      class_id: createdClass.class_id,
      location: `TC014 Studio ${testId}`,
      date: '2030-12-25',
      time: '10:00',
      quota_defined: 10,
      admin_username: 'admin',
    }) as { session_id: string };

    // Step 3: Enroll a participant in that session
    await convexMutation('testPurchase:createTestParticipant', {
      session_id: createdSession.session_id,
      name: `TC014 Participant ${testId}`,
      mobile: '+60100000000',
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

    // Step 6: Find the session row
    const sessionRow = page.locator('tbody tr').filter({ hasText: `TC014 Studio ${testId}` });
    await expect(sessionRow).toHaveCount(1, { timeout: 15_000 });

    // Track if a window.alert dialog fires (it should NOT)
    let alertFired = false;
    page.on('dialog', async (dialog) => {
      if (dialog.type() === 'alert') {
        alertFired = true;
        await dialog.accept();
      } else if (dialog.type() === 'confirm') {
        // Accept the confirmation prompt to proceed with cancellation
        await dialog.accept();
      }
    });

    // Step 7: Click the Cancel button (will trigger window.confirm, then attempt cancellation)
    await sessionRow.getByRole('button', { name: 'Cancel' }).click();

    // Step 8: Wait for navigation / page update
    await page.waitForLoadState('networkidle', { timeout: 30_000 });

    // Screenshot evidence
    const screenshotDir = path.join(process.cwd(), 'test-results');
    await page.screenshot({ path: path.join(screenshotDir, 'tc-014-inline-error.png'), fullPage: true });

    // Step 9: Assert NO window.alert was fired
    expect(alertFired).toBe(false);

    // Step 10: Assert the error message is displayed inline in the page (not as window.alert)
    // The app may show "Failed to cancel session..." or "...enrolled participants..." depending
    // on how the Convex error propagates — either way it must appear inline in the DOM.
    const inlineError = page.locator('p.text-red-700').first();
    await expect(inlineError).toBeVisible({ timeout: 10_000 });

    console.log('TC-014 evidence:', JSON.stringify({
      class_id: createdClass.class_id,
      session_id: createdSession.session_id,
      alert_fired: alertFired,
      inline_error_visible: true,
    }, null, 2));
  });
});
