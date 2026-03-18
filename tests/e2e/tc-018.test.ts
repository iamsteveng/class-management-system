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

test.describe('TC-018: Attendance scanning — successful QR scan marks participant attended with green tick', () => {
  test('TC-018 injecting a valid participant QR code string marks attendance with green tick in the row', async ({ page }) => {
    const testId = Date.now();
    const screenshotDir = path.join(process.cwd(), 'test-results');

    // Step 1: Create a class via Convex
    const createdClass = await convexMutation('adminClasses:createClass', {
      name: `TC018 Class ${testId}`,
      description: 'Attendance QR scan test',
      admin_username: 'admin',
    }) as { class_id: string };

    // Step 2: Create a session for that class
    const createdSession = await convexMutation('adminSessions:createSession', {
      class_id: createdClass.class_id,
      location: `TC018 Studio ${testId}`,
      date: '2030-12-25',
      time: '10:00',
      quota_defined: 10,
      admin_username: 'admin',
    }) as { session_id: string };

    // Step 3: Create a test participant for that session
    const createdParticipant = await convexMutation('testPurchase:createTestParticipant', {
      session_id: createdSession.session_id,
      name: `TC018 Participant ${testId}`,
      mobile: `+6018${testId.toString().slice(-7)}`,
    }) as { participant_id: string };

    console.log(`TC-018 setup: class=${createdClass.class_id} session=${createdSession.session_id} participant=${createdParticipant.participant_id}`);

    // Step 4: Log in as admin
    await page.goto(`${BASE_URL}/admin/login`);
    await page.getByLabel('Username').fill('admin');
    await page.getByLabel('Password').fill('admin123');
    await page.getByRole('button', { name: 'Sign In' }).click();
    await page.waitForURL(/\/admin\/dashboard/, { timeout: 20_000 });

    // Step 5: Navigate to the session participants page
    await page.goto(`${BASE_URL}/admin/sessions/${createdSession.session_id}/participants`);
    await page.waitForLoadState('networkidle', { timeout: 20_000 });

    // Assert the page loaded and participant row is visible
    const participantRow = page.locator('tbody tr').filter({ hasText: `TC018 Participant ${testId}` });
    await expect(participantRow).toHaveCount(1, { timeout: 15_000 });

    // Confirm attendance is not yet marked
    const attendanceCellBefore = participantRow.locator('td').nth(5); // Attendance Status column (0-indexed)
    const statusBefore = await attendanceCellBefore.textContent();
    console.log(`TC-018 attendance status before: "${statusBefore}"`);

    // Screenshot before marking attendance
    await page.screenshot({ path: path.join(screenshotDir, 'tc-018-before-scan.png'), fullPage: true });

    // Step 6: Use the manual entry form to inject the participant QR code string
    // (The participant ID is the QR code payload — extractParticipantId() returns it as-is when not a URL)
    const manualInput = page.getByPlaceholder('Paste participant ID');
    await manualInput.fill(createdParticipant.participant_id);
    await page.getByRole('button', { name: 'Mark' }).click();

    // Step 7: Wait for the attendance status to update in the row (no full page reload)
    await expect(participantRow.locator('td').nth(5)).toContainText('✓', { timeout: 15_000 });

    // Screenshot showing green tick
    await page.screenshot({ path: path.join(screenshotDir, 'tc-018-green-tick.png'), fullPage: true });

    const attendanceCellAfter = participantRow.locator('td').nth(5);
    const statusAfter = await attendanceCellAfter.textContent();
    console.log(`TC-018 attendance status after: "${statusAfter}"`);

    // Step 8: Verify attendance record exists in Convex
    const attendanceRecords = await convexQuery('adminSessions:getSessionAttendance', {
      session_id: createdSession.session_id,
    }) as Array<{
      attendance_id: string;
      participant_id: string;
      session_id: string;
      admin_username: string;
      marked_at: number;
    }>;

    const record = attendanceRecords.find(r => r.participant_id === createdParticipant.participant_id);
    expect(record).toBeDefined();
    expect(record!.participant_id).toBe(createdParticipant.participant_id);
    expect(record!.session_id).toBe(createdSession.session_id);
    expect(record!.admin_username).toBe('admin');
    expect(record!.marked_at).toBeGreaterThan(0);

    // Assert the UI shows the unicode check mark (✓ = \u2713)
    expect(statusAfter).toContain('\u2713');

    console.log('TC-018 evidence:', JSON.stringify({
      participant_id: createdParticipant.participant_id,
      session_id: createdSession.session_id,
      attendance_status_before: statusBefore,
      attendance_status_after: statusAfter,
      green_tick_visible: statusAfter?.includes('\u2713'),
      attendance_record: record,
    }, null, 2));
  });
});
