import { test, expect } from '@playwright/test';
import path from 'path';

const CONVEX_URL = 'https://graceful-mole-393.convex.cloud';
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

test.describe('TC-031: Attendance record — contains correct adminUsername and timestamp', () => {
  test('TC-031 attendance record has marked_by_admin matching admin Convex ID and marked_at within 60s', async ({ page }) => {
    const testId = Date.now();
    const screenshotDir = path.join(process.cwd(), 'test-results');

    // Step 1: Create a class via Convex API
    const createdClass = await convexMutation('adminClasses:createClass', {
      name: `TC031 Class ${testId}`,
      description: 'Attendance record fields test',
      admin_username: 'admin',
    }) as { class_id: string };

    // Step 2: Create a session for that class
    const createdSession = await convexMutation('adminSessions:createSession', {
      class_id: createdClass.class_id,
      location: `TC031 Studio ${testId}`,
      date: '2030-12-25',
      time: '10:00',
      quota_defined: 10,
      admin_username: 'admin',
    }) as { session_id: string };

    // Step 3: Create a test participant enrolled in that session
    const createdParticipant = await convexMutation('testPurchase:createTestParticipant', {
      session_id: createdSession.session_id,
      name: `TC031 Participant ${testId}`,
      mobile: `+6031${testId.toString().slice(-7)}`,
    }) as { participant_id: string };

    console.log(`TC-031 setup: class=${createdClass.class_id} session=${createdSession.session_id} participant=${createdParticipant.participant_id}`);

    // Step 4: Log in as admin (seed admin username = "admin")
    await page.goto(`${BASE_URL}/admin/login`);
    await page.getByLabel('Username').fill('admin');
    await page.getByLabel('Password').fill('admin123');
    await page.getByRole('button', { name: 'Sign In' }).click();
    await page.waitForURL(/\/admin\/dashboard/, { timeout: 20_000 });

    // Step 5: Navigate to session participants page
    await page.goto(`${BASE_URL}/admin/sessions/${createdSession.session_id}/participants`);
    await page.waitForLoadState('networkidle', { timeout: 20_000 });

    // Confirm participant row is visible
    const participantRow = page.locator('tbody tr').filter({ hasText: `TC031 Participant ${testId}` });
    await expect(participantRow).toHaveCount(1, { timeout: 15_000 });

    // Screenshot before marking attendance
    await page.screenshot({ path: path.join(screenshotDir, 'tc-031-before-mark.png'), fullPage: true });

    // Step 6: Record time before marking attendance
    const beforeScanTs = Date.now();

    // Step 7: Use the manual entry form to mark attendance (simulates scanning QR code)
    const manualInput = page.getByPlaceholder('Paste participant ID');
    await manualInput.fill(createdParticipant.participant_id);
    await page.getByRole('button', { name: 'Mark' }).click();

    // Step 8: Wait for attendance status to update in the row
    await expect(participantRow.locator('td').nth(5)).toContainText('✓', { timeout: 15_000 });

    // Record time after marking
    const afterScanTs = Date.now();

    // Screenshot after marking attendance
    await page.screenshot({ path: path.join(screenshotDir, 'tc-031-after-mark.png'), fullPage: true });

    // Step 9: Query the attendance record from Convex
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
    expect(record, 'attendance record must exist for participant').toBeDefined();

    // Pass criterion 1: admin_username matches the logged-in admin ("admin" → mapped from marked_by_admin Convex ID)
    expect(record!.admin_username).toBe('admin');

    // Pass criterion 2: marked_at is a recent Unix timestamp (within 60 seconds of the scan)
    const markedAt = record!.marked_at;
    const withinWindow = markedAt >= beforeScanTs - 5_000 && markedAt <= afterScanTs + 60_000;
    expect(withinWindow, `marked_at=${markedAt} should be within 60s of scan window [${beforeScanTs}, ${afterScanTs}]`).toBe(true);

    console.log('TC-031 evidence (attendance record):', JSON.stringify({
      attendance_id: record!.attendance_id,
      participant_id: record!.participant_id,
      session_id: record!.session_id,
      admin_username: record!.admin_username,
      marked_at: record!.marked_at,
      marked_at_iso: new Date(record!.marked_at).toISOString(),
      scan_window_ms: afterScanTs - beforeScanTs,
      age_seconds: (afterScanTs - markedAt) / 1000,
    }, null, 2));

    console.log('TC-031 PASS: attendance record has correct admin_username="admin" and marked_at within 60s of scan');
  });
});
