import { test, expect } from '@playwright/test';

import { BASE_URL, convex } from './helpers/applyFixture';

// TC-086 (#31): Past the Change Cutoff a Participant can't move themselves, but a Super
// Admin can, even after they were scanned (e.g. they left sick), with a reason that is
// recorded and shown in the Participant's history.

test('TC-086 Super Admin moves a scanned Participant past the cutoff, with a reason', async ({ page }) => {
  test.setTimeout(90_000);
  const testId = Date.now();
  const { class_id: classId } = (await convex('mutation', 'adminClasses:createClass', {
    name_zh: `TC086 Class ${testId}`,
    is_free: true,
    admin_username: 'admin',
  })) as { class_id: string };
  const today = new Date(Date.now() + 8 * 3_600_000).toISOString().slice(0, 10);
  const create = async (date: string, time: string, label: string) =>
    (
      (await convex('mutation', 'adminSessions:createSession', {
        class_id: classId,
        location_zh: `${label} ${testId}`,
        date,
        time,
        quota_defined: 5,
        admin_username: 'admin',
      })) as { session_id: string }
    ).session_id;
  const todaySession = await create(today, '23:59', 'TC086 Today');
  await create('2030-11-08', '10:00', 'TC086 Later');

  try {
    const { participant_id: pid } = (await convex('mutation', 'testPurchase:createTestParticipant', {
      session_id: todaySession,
      name: 'Sick Rider',
      mobile: '+85291086086',
    })) as { participant_id: string };
    const scan = (await convex('mutation', 'adminSessions:markAttendanceFromScan', {
      session_id: todaySession,
      participant_id: pid,
      admin_username: 'staff',
    })) as { status: string };
    expect(scan.status).toBe('success');

    // The Participant is past the cutoff: no self-service change, and they are told why
    await page.goto(`${BASE_URL}/participant/${pid}`);
    await expect(page.getByTestId('change-cutoff-passed')).toContainText('上課前兩日 00:00');

    // A Super Admin moves them, and must give a reason
    await page.goto(`${BASE_URL}/admin/login`);
    await page.getByLabel('Username').fill('admin');
    await page.getByLabel('Password').fill('admin123');
    await page.getByRole('button', { name: 'Sign In' }).click();
    await page.waitForURL(/\/admin\/dashboard/, { timeout: 20_000 });
    await page.goto(`${BASE_URL}/admin/participants/${pid}`);
    await page.getByRole('button', { name: 'Change Session' }).click();
    await expect(page.getByTestId('past-cutoff-notice')).toBeVisible();
    await page.locator('label', { hasText: `TC086 Later ${testId}` }).locator('input[type="radio"]').check();
    await expect(page.locator('textarea[name="reason"]')).toHaveAttribute('required', '');
    await page.locator('textarea[name="reason"]').fill('Left sick part-way; rebooked');
    await page.getByRole('button', { name: 'Confirm Change' }).click();
    await page.waitForURL(/status=session_changed/, { timeout: 20_000 });

    // History keeps the Scan at the first Session and records the move with its reason
    const history = page.getByTestId('participant-history');
    await expect(history).toContainText(`Scanned at ${today} 23:59 TC086 Today ${testId} by staff`);
    await expect(history).toContainText(`to 2030-11-08 10:00 TC086 Later ${testId} by admin`);
    await expect(history).toContainText('reason: Left sick part-way; rebooked');

    // The old roster no longer lists them
    await page.goto(`${BASE_URL}/admin/sessions/${todaySession}/participants`);
    await expect(page.locator('tr', { hasText: 'Sick Rider' })).toHaveCount(0);
  } finally {
    await convex('mutation', 'adminClasses:setClassStatus', { class_id: classId, status: 'inactive', admin_username: 'admin' });
  }
});
