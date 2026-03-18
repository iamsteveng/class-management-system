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

test.describe('TC-019: Attendance scanning — scanning unknown QR shows error', () => {
  test('TC-019 injecting an unrecognised QR string shows error message without crashing or creating attendance record', async ({ page }) => {
    const testId = Date.now();
    const screenshotDir = path.join(process.cwd(), 'test-results');

    // Step 1: Create a class via Convex
    const createdClass = await convexMutation('adminClasses:createClass', {
      name: `TC019 Class ${testId}`,
      description: 'Unknown QR error test',
      admin_username: 'admin',
    }) as { class_id: string };

    // Step 2: Create a session for that class
    const createdSession = await convexMutation('adminSessions:createSession', {
      class_id: createdClass.class_id,
      location: `TC019 Studio ${testId}`,
      date: '2030-12-25',
      time: '10:00',
      quota_defined: 10,
      admin_username: 'admin',
    }) as { session_id: string };

    console.log(`TC-019 setup: class=${createdClass.class_id} session=${createdSession.session_id}`);

    // Step 3: Log in as admin
    await page.goto(`${BASE_URL}/admin/login`);
    await page.getByLabel('Username').fill('admin');
    await page.getByLabel('Password').fill('admin123');
    await page.getByRole('button', { name: 'Sign In' }).click();
    await page.waitForURL(/\/admin\/dashboard/, { timeout: 20_000 });

    // Step 4: Navigate to session participants page
    await page.goto(`${BASE_URL}/admin/sessions/${createdSession.session_id}/participants`);
    await page.waitForLoadState('networkidle', { timeout: 20_000 });

    // Screenshot before injecting unknown QR
    await page.screenshot({ path: path.join(screenshotDir, 'tc-019-before-scan.png'), fullPage: true });

    // Step 5: Inject an unrecognised QR string via the manual entry form
    const unknownQrString = `UNKNOWN-QR-${testId}-not-a-real-participant`;
    const manualInput = page.getByPlaceholder('Paste participant ID');
    await manualInput.fill(unknownQrString);
    await page.getByRole('button', { name: 'Mark' }).click();

    // Step 6: Assert error toast is shown
    const errorToast = page.locator('[role="status"]');
    await expect(errorToast).toBeVisible({ timeout: 10_000 });
    const toastText = await errorToast.textContent();
    console.log(`TC-019 error toast text: "${toastText}"`);
    expect(toastText).toContain('not found');

    // Screenshot showing error message
    await page.screenshot({ path: path.join(screenshotDir, 'tc-019-error-toast.png'), fullPage: true });

    // Step 7: Assert application has not crashed (page still shows participants table)
    await expect(page.locator('table')).toBeVisible({ timeout: 5_000 });

    // Step 8: Verify no attendance record was created for the unknown QR string
    const attendanceRecords = await convexQuery('adminSessions:getSessionAttendance', {
      session_id: createdSession.session_id,
    }) as Array<{
      attendance_id: string;
      participant_id: string;
      session_id: string;
      admin_username: string;
      marked_at: number;
    }>;

    const spuriousRecord = attendanceRecords.find(r => r.participant_id === unknownQrString);
    expect(spuriousRecord).toBeUndefined();
    expect(attendanceRecords).toHaveLength(0);

    console.log('TC-019 evidence:', JSON.stringify({
      unknown_qr_string: unknownQrString,
      session_id: createdSession.session_id,
      error_toast_text: toastText,
      attendance_records_count: attendanceRecords.length,
      app_did_not_crash: true,
    }, null, 2));
  });
});
