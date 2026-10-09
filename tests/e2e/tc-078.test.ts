import { test, expect } from '@playwright/test';
import path from 'path';
import { withServerSecret } from './helpers/serverSecret';

// TC-078: A Super Admin hides a Session; it disappears from the class list API (homepage),
// the single-Class sessions API and the terms form, then reappears when shown again.

const CONVEX_URL = 'https://graceful-mole-393.convex.cloud';
const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

async function convexMutation(fnPath: string, args: Record<string, unknown>) {
  const res = await fetch(`${CONVEX_URL}/api/mutation`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ path: fnPath, args: withServerSecret(fnPath, args), format: 'json' }),
  });
  const json = await res.json() as { status: string; value?: unknown; errorMessage?: string };
  if (json.status !== 'success') throw new Error(`Mutation ${fnPath} failed: ${json.errorMessage}`);
  return json.value;
}

async function listedSessionIds(classId: string): Promise<{ classList: string[]; classSessions: string[] }> {
  const classesRes = await fetch(`${BASE_URL}/api/classes?t=${Date.now()}`);
  const { classes } = await classesRes.json() as {
    classes: Array<{ class_id: string; sessions: Array<{ session_id: string }> }>;
  };
  const cls = classes.find((c) => c.class_id === classId);

  const sessionsRes = await fetch(`${BASE_URL}/api/classes/${classId}/sessions?t=${Date.now()}`);
  const sessionsJson = await sessionsRes.json() as { sessions?: Array<{ session_id: string }> };

  return {
    classList: (cls?.sessions ?? []).map((s) => s.session_id),
    classSessions: (sessionsJson.sessions ?? []).map((s) => s.session_id),
  };
}

test.describe('TC-078: Hidden Sessions', () => {
  test('TC-078 hiding a session removes it from the class APIs and the terms form, showing restores it', async ({ page }) => {
    const testId = Date.now();
    const screenshotDir = path.join(process.cwd(), 'test-results');

    const createdClass = await convexMutation('adminClasses:createClass', {
      name_zh: `TC078 Class ${testId}`,
      is_free: true,
      admin_username: 'admin',
    }) as { class_id: string };
    const classId = createdClass.class_id;

    const visibleSession = await convexMutation('adminSessions:createSession', {
      class_id: classId,
      location_zh: `TC078 Visible ${testId}`,
      date: '2030-11-01',
      time: '10:00',
      quota_defined: 10,
      admin_username: 'admin',
    }) as { session_id: string };
    const toHideSession = await convexMutation('adminSessions:createSession', {
      class_id: classId,
      location_zh: `TC078 ToHide ${testId}`,
      date: '2030-11-02',
      time: '10:00',
      quota_defined: 10,
      admin_username: 'admin',
    }) as { session_id: string };

    const purchase = await convexMutation('testPurchase:createTestPurchase', {
      customer_mobile: '+6599078078',
      participant_count: 1,
      class_id: classId,
    }) as { token: string };

    try {
      // Both Sessions are listed before hiding
      const before = await listedSessionIds(classId);
      expect(before.classList).toEqual([visibleSession.session_id, toHideSession.session_id]);

      // Log in as Super Admin and hide the second Session
      await page.goto(`${BASE_URL}/admin/login`);
      await page.getByLabel('Username').fill('admin');
      await page.getByLabel('Password').fill('admin123');
      await page.getByRole('button', { name: 'Sign In' }).click();
      await page.waitForURL(/\/admin\/dashboard/, { timeout: 20_000 });

      await page.goto(`${BASE_URL}/admin/classes/${classId}/sessions`);
      const row = page.locator('tr', { hasText: `TC078 ToHide ${testId}` });
      page.once('dialog', (dialog) => dialog.accept());
      await row.getByRole('button', { name: 'Hide' }).click();
      await page.waitForURL(/status=session_hidden/, { timeout: 20_000 });
      await expect(row.getByTestId('session-hidden-badge')).toBeVisible();
      await expect(
        page.locator('tr', { hasText: `TC078 Visible ${testId}` }).getByTestId('session-hidden-badge')
      ).toHaveCount(0);
      await page.screenshot({ path: path.join(screenshotDir, 'tc-078-admin-hidden.png'), fullPage: true });

      // Gone from the class list API (homepage) and the single-Class sessions API
      const after = await listedSessionIds(classId);
      expect(after.classList).toEqual([visibleSession.session_id]);
      expect(after.classSessions).toEqual([visibleSession.session_id]);

      // Gone from the terms form's Session picker
      await page.goto(`${BASE_URL}/terms?token=${purchase.token}`);
      const picker = page.locator('select#session_id');
      await expect(picker.locator(`option[value="${visibleSession.session_id}"]`)).toHaveCount(1);
      await expect(picker.locator(`option[value="${toHideSession.session_id}"]`)).toHaveCount(0);

      // Showing it again restores it
      await page.goto(`${BASE_URL}/admin/classes/${classId}/sessions`);
      page.once('dialog', (dialog) => dialog.accept());
      await row.getByRole('button', { name: 'Show' }).click();
      await page.waitForURL(/status=session_shown/, { timeout: 20_000 });
      await expect(row.getByTestId('session-hidden-badge')).toHaveCount(0);

      const restored = await listedSessionIds(classId);
      expect(restored.classList).toEqual([visibleSession.session_id, toHideSession.session_id]);
    } finally {
      await convexMutation('adminClasses:setClassStatus', {
        class_id: classId,
        status: 'inactive',
        admin_username: 'admin',
      });
    }
  });
});
