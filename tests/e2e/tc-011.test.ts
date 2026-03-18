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

test.describe('TC-011: Admin participant list — clicking participant row opens detail page', () => {
  test('TC-011 clicking View on participant row navigates to /admin/participants/<participant_id>', async ({ page }) => {
    const testId = Date.now();

    // Step 1: Create a class via Convex
    const createdClass = await convexMutation('adminClasses:createClass', {
      name: `TC011 Class ${testId}`,
      description: 'Participant detail navigation test',
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

    // Step 4: Log in as admin
    await page.goto(`${BASE_URL}/admin/login`);
    await page.getByLabel('Username').fill('admin');
    await page.getByLabel('Password').fill('admin123');
    await page.getByRole('button', { name: 'Sign In' }).click();
    await page.waitForURL(/\/admin\/dashboard/, { timeout: 20_000 });

    // Step 5: Navigate to session participants page
    await page.goto(`${BASE_URL}/admin/sessions/${createdSession.session_id}/participants`);
    await page.waitForLoadState('networkidle');

    // Step 6: Assert participants list heading is visible
    await expect(page.getByRole('heading', { name: 'Session Participants' })).toBeVisible({ timeout: 15_000 });

    // Step 7: Find the participant row and click the View link
    const participantRow = page.locator('tbody tr').filter({ hasText: `TC011 Tester ${testId}` });
    await expect(participantRow).toHaveCount(1, { timeout: 10_000 });
    await participantRow.getByRole('link', { name: 'View' }).click();

    // Step 8: Assert URL navigated to /admin/participants/<participant_id>
    await page.waitForURL(/\/admin\/participants\//, { timeout: 20_000 });
    const currentUrl = page.url();
    expect(currentUrl).toContain(`/admin/participants/${createdParticipant.participant_id}`);

    // Step 9: Assert participant name is visible on the detail page
    await expect(page.getByRole('heading', { name: 'Participant Details' })).toBeVisible({ timeout: 15_000 });
    const participantName = `TC011 Tester ${testId}`;
    await expect(page.getByText(participantName)).toBeVisible({ timeout: 10_000 });

    // Screenshot evidence
    const screenshotDir = path.join(process.cwd(), 'test-results');
    await page.screenshot({ path: path.join(screenshotDir, 'tc-011-participant-detail.png'), fullPage: true });

    console.log('TC-011 evidence:', JSON.stringify({
      class_id: createdClass.class_id,
      session_id: createdSession.session_id,
      participant_id: createdParticipant.participant_id,
      final_url: currentUrl,
      participant_name_visible: true,
    }, null, 2));
  });
});
