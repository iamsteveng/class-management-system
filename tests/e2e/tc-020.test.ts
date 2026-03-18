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

async function convexQuery(fnPath: string, args: Record<string, unknown>) {
  const res = await fetch(`${CONVEX_URL}/api/query`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ path: fnPath, args, format: 'json' }),
  });
  const json = await res.json() as { status: string; value?: unknown; errorMessage?: string };
  if (json.status !== 'success') throw new Error(`Query ${fnPath} failed: ${json.errorMessage}`);
  return json.value;
}

test.describe('TC-020: Attendance scanning — re-scanning same participant is idempotent', () => {
  test('TC-020 scanning the same participant QR code twice produces only one attendance record', async ({ page }) => {
    const testId = Date.now();
    const screenshotDir = path.join(process.cwd(), 'test-results');

    // Step 1: Create a class via Convex
    const createdClass = await convexMutation('adminClasses:createClass', {
      name: `TC020 Class ${testId}`,
      description: 'Idempotent attendance scan test',
      admin_username: 'admin',
    }) as { class_id: string };

    // Step 2: Create a session for that class
    const createdSession = await convexMutation('adminSessions:createSession', {
      class_id: createdClass.class_id,
      location: `TC020 Studio ${testId}`,
      date: '2030-12-25',
      time: '10:00',
      quota_defined: 10,
      admin_username: 'admin',
    }) as { session_id: string };

    // Step 3: Create a test participant for that session
    const createdParticipant = await convexMutation('testPurchase:createTestParticipant', {
      session_id: createdSession.session_id,
      name: `TC020 Participant ${testId}`,
      mobile: `+6020${testId.toString().slice(-7)}`,
    }) as { participant_id: string };

    console.log(`TC-020 setup: class=${createdClass.class_id} session=${createdSession.session_id} participant=${createdParticipant.participant_id}`);

    // Step 4: Log in as admin
    await page.goto(`${BASE_URL}/admin/login`);
    await page.getByLabel('Username').fill('admin');
    await page.getByLabel('Password').fill('admin123');
    await page.getByRole('button', { name: 'Sign In' }).click();
    await page.waitForURL(/\/admin\/dashboard/, { timeout: 20_000 });

    // Step 5: Navigate to the session participants page
    await page.goto(`${BASE_URL}/admin/sessions/${createdSession.session_id}/participants`);
    await page.waitForLoadState('networkidle', { timeout: 20_000 });

    const participantRow = page.locator('tbody tr').filter({ hasText: `TC020 Participant ${testId}` });
    await expect(participantRow).toHaveCount(1, { timeout: 15_000 });

    // Screenshot before any scan
    await page.screenshot({ path: path.join(screenshotDir, 'tc-020-before-first-scan.png'), fullPage: true });

    // Step 6: First scan — mark attendance
    const manualInput = page.getByPlaceholder('Paste participant ID');
    await manualInput.fill(createdParticipant.participant_id);
    await page.getByRole('button', { name: 'Mark' }).click();

    // Wait for green tick to appear after first scan
    await expect(participantRow.locator('td').nth(5)).toContainText('✓', { timeout: 15_000 });

    // Screenshot after first scan
    await page.screenshot({ path: path.join(screenshotDir, 'tc-020-after-first-scan.png'), fullPage: true });

    console.log('TC-020: First scan complete — green tick visible');

    // Step 7: Second scan — re-scan the same participant QR code
    await manualInput.fill(createdParticipant.participant_id);
    await page.getByRole('button', { name: 'Mark' }).click();

    // Wait briefly for any UI response to settle
    await page.waitForTimeout(3000);

    // Screenshot after second scan
    await page.screenshot({ path: path.join(screenshotDir, 'tc-020-after-second-scan.png'), fullPage: true });

    // Step 8: Green tick must still be visible (no crash, UI intact)
    await expect(participantRow.locator('td').nth(5)).toContainText('✓', { timeout: 10_000 });

    // Step 9: Assert only ONE attendance record exists in Convex (idempotency)
    const attendanceRecords = await convexQuery('adminSessions:getSessionAttendance', {
      session_id: createdSession.session_id,
    }) as Array<{
      attendance_id: string;
      participant_id: string;
      session_id: string;
      admin_username: string;
      marked_at: number;
    }>;

    const recordsForParticipant = attendanceRecords.filter(
      r => r.participant_id === createdParticipant.participant_id,
    );

    console.log('TC-020 evidence:', JSON.stringify({
      participant_id: createdParticipant.participant_id,
      session_id: createdSession.session_id,
      total_attendance_records: attendanceRecords.length,
      records_for_participant: recordsForParticipant.length,
      records_detail: recordsForParticipant,
    }, null, 2));

    // PASS criteria: exactly one record for this participant/session
    expect(recordsForParticipant).toHaveLength(1);
    expect(recordsForParticipant[0].participant_id).toBe(createdParticipant.participant_id);
    expect(recordsForParticipant[0].session_id).toBe(createdSession.session_id);
  });
});
