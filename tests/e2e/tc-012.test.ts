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

test.describe('TC-012: Change Session selector shows only eligible sessions (same class, scheduled, quota > 0)', () => {
  test('TC-012 Change Session selector shows only same-class scheduled sessions with available quota', async ({ page }) => {
    const testId = Date.now();

    // Step 1: Create Class A — the participant's class
    const classA = await convexMutation('adminClasses:createClass', {
      name_zh: `TC012 Class A ${testId}`,
      description: 'TC012 eligible sessions test',
      admin_username: 'admin',
    }) as { class_id: string };

    // Step 2: Session A1 in Class A — participant's current session (should NOT appear — excluded as current)
    const sessionA1 = await convexMutation('adminSessions:createSession', {
      class_id: classA.class_id,
      location_zh: `TC012-A1-Current-${testId}`,
      date: '2030-12-20',
      time: '09:00',
      quota_defined: 10,
      admin_username: 'admin',
    }) as { session_id: string };

    // Step 3: Session A2 in Class A — eligible (scheduled, quota available) — SHOULD appear
    const sessionA2 = await convexMutation('adminSessions:createSession', {
      class_id: classA.class_id,
      location_zh: `TC012-A2-Eligible-${testId}`,
      date: '2030-12-25',
      time: '10:00',
      quota_defined: 10,
      admin_username: 'admin',
    }) as { session_id: string };

    // Step 4: Session A3 in Class A — full (quota_used = quota_defined) — should NOT appear
    const sessionA3 = await convexMutation('adminSessions:createSession', {
      class_id: classA.class_id,
      location_zh: `TC012-A3-Full-${testId}`,
      date: '2030-12-27',
      time: '11:00',
      quota_defined: 5,
      admin_username: 'admin',
    }) as { session_id: string };
    // Fill up session A3 by setting quota_used = quota_defined
    await convexMutation('testPurchase:setSessionQuotaUsed', {
      session_id: sessionA3.session_id,
      quota_used: 5,
    });

    // Step 5: Session A4 in Class A — cancelled — should NOT appear
    const sessionA4 = await convexMutation('adminSessions:createSession', {
      class_id: classA.class_id,
      location_zh: `TC012-A4-Cancelled-${testId}`,
      date: '2030-12-28',
      time: '12:00',
      quota_defined: 10,
      admin_username: 'admin',
    }) as { session_id: string };
    await convexMutation('adminSessions:cancelSession', {
      session_id: sessionA4.session_id,
      admin_username: 'admin',
    });

    // Step 6: Create Class B — different class, its sessions should NOT appear
    const classB = await convexMutation('adminClasses:createClass', {
      name_zh: `TC012 Class B ${testId}`,
      description: 'TC012 different class',
      admin_username: 'admin',
    }) as { class_id: string };

    // Step 7: Session B1 in Class B — should NOT appear (different class)
    await convexMutation('adminSessions:createSession', {
      class_id: classB.class_id,
      location_zh: `TC012-B1-DiffClass-${testId}`,
      date: '2030-12-26',
      time: '14:00',
      quota_defined: 10,
      admin_username: 'admin',
    });

    // Step 8: Create participant enrolled in Session A1
    const participant = await convexMutation('testPurchase:createTestParticipant', {
      session_id: sessionA1.session_id,
      name: `TC012 Participant ${testId}`,
      mobile: '+60123456789',
    }) as { participant_id: string };

    // Step 9: Log in as super_admin
    await page.goto(`${BASE_URL}/admin/login`);
    await page.getByLabel('Username').fill('admin');
    await page.getByLabel('Password').fill('admin123');
    await page.getByRole('button', { name: 'Sign In' }).click();
    await page.waitForURL(/\/admin\/dashboard/, { timeout: 20_000 });

    // Step 10: Navigate to participant detail page
    await page.goto(`${BASE_URL}/admin/participants/${participant.participant_id}`);
    await page.waitForLoadState('networkidle');
    await expect(page.getByRole('heading', { name: 'Participant Details' })).toBeVisible({ timeout: 15_000 });

    // Step 11: Click "Change Session" to open the modal
    const changeSessionBtn = page.getByRole('button', { name: 'Change Session' });
    await expect(changeSessionBtn).toBeVisible({ timeout: 10_000 });
    await changeSessionBtn.click();

    // Step 12: Verify modal opened
    await expect(page.getByRole('heading', { name: 'Change Session' })).toBeVisible({ timeout: 10_000 });

    // Screenshot evidence — Change Session selector
    const screenshotDir = path.join(process.cwd(), 'test-results');
    await page.screenshot({ path: path.join(screenshotDir, 'tc-012-change-session-selector.png'), fullPage: true });

    // Step 13: Verify the selector lists only Session A2 (the one eligible session)
    const sessionLabels = page.locator('fieldset label');
    const labelCount = await sessionLabels.count();
    // Exactly 1 eligible session should appear: A2 (A1=current excluded, A3=full, A4=cancelled, B1=different class)
    expect(labelCount).toBe(1);

    // Step 14: Verify the eligible session shows date, time, and location
    const firstLabel = sessionLabels.first();
    await expect(firstLabel).toContainText('2030-12-25');            // date
    await expect(firstLabel).toContainText('10:00');                  // time
    await expect(firstLabel).toContainText(`TC012-A2-Eligible-${testId}`); // location

    // Step 15: Verify ineligible sessions are absent from the selector
    const allLabelTexts = await sessionLabels.allTextContents();
    const combined = allLabelTexts.join(' ');

    expect(combined).not.toContain(`TC012-A1-Current-${testId}`);   // current session excluded
    expect(combined).not.toContain(`TC012-A3-Full-${testId}`);      // full quota excluded
    expect(combined).not.toContain(`TC012-A4-Cancelled-${testId}`); // cancelled excluded
    expect(combined).not.toContain(`TC012-B1-DiffClass-${testId}`); // different class excluded

    console.log('TC-012 evidence:', JSON.stringify({
      class_a_id: classA.class_id,
      class_b_id: classB.class_id,
      session_a1_current: sessionA1.session_id,
      session_a2_eligible: sessionA2.session_id,
      session_a3_full: sessionA3.session_id,
      session_a4_cancelled: sessionA4.session_id,
      participant_id: participant.participant_id,
      eligible_sessions_shown: labelCount,
      eligible_session_has_date_time_location: true,
    }, null, 2));
  });
});
