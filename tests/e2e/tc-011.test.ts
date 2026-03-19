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

test.describe('TC-011: Regular admin does NOT see Change Session button', () => {
  test('TC-011 regular_admin does not see Change Session button on participant detail page', async ({ page }) => {
    const testId = Date.now();

    // Step 1: Create a class via Convex
    const createdClass = await convexMutation('adminClasses:createClass', {
      name: `TC011 Class ${testId}`,
      description: 'Change Session button hidden for regular_admin test',
      admin_username: 'admin',
    }) as { class_id: string };

    // Step 2: Create a session via Convex
    const createdSession = await convexMutation('adminSessions:createSession', {
      class_id: createdClass.class_id,
      location: `TC011 Studio ${testId}`,
      date: '2030-12-25',
      time: '10:00',
      quota_defined: 10,
      admin_username: 'admin',
    }) as { session_id: string };

    // Step 3: Create a test participant for the session
    const createdParticipant = await convexMutation('testPurchase:createTestParticipant', {
      session_id: createdSession.session_id,
      name: `TC011 Tester ${testId}`,
      mobile: '+60123456789',
    }) as { participant_id: string };

    // Step 4: Log in as regular_admin (staff/staff123)
    await page.goto(`${BASE_URL}/admin/login`);
    await page.getByLabel('Username').fill('staff');
    await page.getByLabel('Password').fill('staff123');
    await page.getByRole('button', { name: 'Sign In' }).click();
    await page.waitForURL(/\/admin\/dashboard/, { timeout: 20_000 });

    // Step 5: Navigate directly to the participant detail page
    await page.goto(`${BASE_URL}/admin/participants/${createdParticipant.participant_id}`);
    await page.waitForLoadState('networkidle');

    // Step 6: Assert participant detail heading is visible
    await expect(page.getByRole('heading', { name: 'Participant Details' })).toBeVisible({ timeout: 15_000 });

    // Step 7: Assert the "Change Session" button is NOT present (regular_admin only)
    const changeSessionBtn = page.getByRole('button', { name: 'Change Session' });
    await expect(changeSessionBtn).not.toBeVisible({ timeout: 5_000 });

    // Screenshot evidence
    const screenshotDir = path.join(process.cwd(), 'test-results');
    await page.screenshot({ path: path.join(screenshotDir, 'tc-011-no-change-session-button.png'), fullPage: true });

    console.log('TC-011 evidence:', JSON.stringify({
      class_id: createdClass.class_id,
      session_id: createdSession.session_id,
      participant_id: createdParticipant.participant_id,
      change_session_button_visible: false,
    }, null, 2));
  });
});
