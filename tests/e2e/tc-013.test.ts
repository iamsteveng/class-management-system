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

test.describe('TC-013: Change Session selector excludes full sessions (quota = 0)', () => {
  test('TC-013 Change Session selector does not show sessions where quota_used = quota_defined', async ({ page }) => {
    const testId = Date.now();

    // Step 1: Create a class
    const cls = await convexMutation('adminClasses:createClass', {
      name_zh: `TC013 Class ${testId}`,
      description: 'TC013 full session exclusion test',
      admin_username: 'admin',
    }) as { class_id: string };

    // Step 2: Create participant's current session
    const currentSession = await convexMutation('adminSessions:createSession', {
      class_id: cls.class_id,
      location_zh: `TC013-Current-${testId}`,
      date: '2030-11-10',
      time: '09:00',
      quota_defined: 10,
      admin_username: 'admin',
    }) as { session_id: string };

    // Step 3: Create an eligible session (has available quota) — SHOULD appear in selector
    await convexMutation('adminSessions:createSession', {
      class_id: cls.class_id,
      location_zh: `TC013-Available-${testId}`,
      date: '2030-11-20',
      time: '10:00',
      quota_defined: 5,
      admin_username: 'admin',
    }) as { session_id: string };

    // Step 4: Create a full session (quota_used = quota_defined) — should NOT appear
    const fullSession = await convexMutation('adminSessions:createSession', {
      class_id: cls.class_id,
      location_zh: `TC013-Full-${testId}`,
      date: '2030-11-25',
      time: '11:00',
      quota_defined: 3,
      admin_username: 'admin',
    }) as { session_id: string };
    // Fill up the session so quota_used = quota_defined (no remaining quota)
    await convexMutation('testPurchase:setSessionQuotaUsed', {
      session_id: fullSession.session_id,
      quota_used: 3,
    });

    // Step 5: Create participant enrolled in the current session
    const participant = await convexMutation('testPurchase:createTestParticipant', {
      session_id: currentSession.session_id,
      name: `TC013 Participant ${testId}`,
      mobile: '+60198765432',
    }) as { participant_id: string };

    // Step 6: Log in as super_admin
    await page.goto(`${BASE_URL}/admin/login`);
    await page.getByLabel('Username').fill('admin');
    await page.getByLabel('Password').fill('admin123');
    await page.getByRole('button', { name: 'Sign In' }).click();
    await page.waitForURL(/\/admin\/dashboard/, { timeout: 20_000 });

    // Step 7: Navigate to participant detail page
    await page.goto(`${BASE_URL}/admin/participants/${participant.participant_id}`);
    await page.waitForLoadState('networkidle');
    await expect(page.getByRole('heading', { name: 'Participant Details' })).toBeVisible({ timeout: 15_000 });

    // Step 8: Open the Change Session modal
    const changeSessionBtn = page.getByRole('button', { name: 'Change Session' });
    await expect(changeSessionBtn).toBeVisible({ timeout: 10_000 });
    await changeSessionBtn.click();

    // Step 9: Verify modal opened
    await expect(page.getByRole('heading', { name: 'Change Session' })).toBeVisible({ timeout: 10_000 });

    // Screenshot evidence — Change Session selector with full session absent
    const screenshotDir = path.join(process.cwd(), 'test-results');
    await page.screenshot({ path: path.join(screenshotDir, 'tc-013-change-session-selector.png'), fullPage: true });

    // Step 10: Collect all session labels shown in the selector
    const sessionLabels = page.locator('fieldset label');
    const labelCount = await sessionLabels.count();
    const allLabelTexts = await sessionLabels.allTextContents();
    const combined = allLabelTexts.join(' ');

    // Pass criteria: full session must NOT appear
    expect(combined).not.toContain(`TC013-Full-${testId}`);

    // Pass criteria: current session must NOT appear (excluded as current)
    expect(combined).not.toContain(`TC013-Current-${testId}`);

    // Pass criteria: available session SHOULD appear
    expect(combined).toContain(`TC013-Available-${testId}`);

    // Pass criteria: exactly 1 eligible session shown (the available one)
    expect(labelCount).toBe(1);

    console.log('TC-013 evidence:', JSON.stringify({
      class_id: cls.class_id,
      current_session_id: currentSession.session_id,
      full_session_id: fullSession.session_id,
      participant_id: participant.participant_id,
      sessions_shown_in_selector: labelCount,
      full_session_absent: !combined.includes(`TC013-Full-${testId}`),
      available_session_present: combined.includes(`TC013-Available-${testId}`),
      label_texts: allLabelTexts,
    }, null, 2));
  });
});
