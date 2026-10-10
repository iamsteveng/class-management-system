import { test, expect } from '@playwright/test';
import path from 'path';
import { withServerSecret } from './helpers/serverSecret';

// TC-079: New apply flow, free Class. The Customer picks a Session, books two adults,
// accepts the terms on their behalf, and both appear as Participants of that Session.

const CONVEX_URL = 'https://graceful-mole-393.convex.cloud';
const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

async function convex(kind: 'mutation' | 'query', fnPath: string, args: Record<string, unknown>) {
  const res = await fetch(`${CONVEX_URL}/api/${kind}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ path: fnPath, args: withServerSecret(fnPath, args), format: 'json' }),
  });
  const json = (await res.json()) as { status: string; value?: unknown; errorMessage?: string };
  if (json.status !== 'success') throw new Error(`${fnPath} failed: ${json.errorMessage}`);
  return json.value;
}

test.describe('TC-079: apply flow books named Participants into the chosen Session', () => {
  test('TC-079 free Class: pick Session, name two people, accept terms, confirm', async ({ page }) => {
    test.setTimeout(90_000);
    const testId = Date.now();
    await page.setViewportSize({ width: 390, height: 844 });

    const { class_id: classId } = (await convex('mutation', 'adminClasses:createClass', {
      name_zh: `TC079 Class ${testId}`,
      is_free: true,
      admin_username: 'admin',
    })) as { class_id: string };
    const { session_id: sessionId } = (await convex('mutation', 'adminSessions:createSession', {
      class_id: classId,
      location_zh: `TC079 Venue ${testId}`,
      date: '2030-11-01',
      time: '10:00',
      quota_defined: 5,
      admin_username: 'admin',
    })) as { session_id: string };

    try {
      await page.goto(`${BASE_URL}/apply/${classId}`);
      await page.locator(`[data-session-id="${sessionId}"]`).click();
      await expect(page.getByTestId('selected-session')).toContainText('11月1日');

      await page.getByRole('button', { name: '+' }).click();
      await expect(page.getByTestId('quantity')).toHaveText('2');

      await page.locator('input[name="customer_mobile"]').fill('+85291079079');
      await page.locator('input[name="p0_name"]').fill('陳大文');
      await page.locator('input[name="p0_age"]').fill('35');
      await page.locator('input[name="p0_height"]').fill('172');
      await page.locator('input[name="p0_experience"][value="training_wheels"]').check();
      await page.locator('input[name="p0_emergency_name"]').fill('陳太');
      await page.locator('input[name="p0_emergency_phone"]').fill('+85298079079');
      await page.locator('textarea[name="p0_health"]').fill('哮喘');
      await page.locator('input[name="p0_photo"]').check();

      await page.locator('input[name="p1_name"]').fill('陳小文');
      await page.locator('input[name="p1_age"]').fill('33');
      await page.locator('input[name="p1_height"]').fill('160');
      await page.locator('input[name="p1_mobile_same"]').uncheck();
      await page.locator('input[name="p1_mobile"]').fill('+85296079079');

      // Submitting without the terms is refused
      await page.getByRole('button', { name: '確認報名' }).click();
      await expect(page.getByTestId('apply-form').getByRole('alert')).toHaveText('請先同意條款。');

      await page.locator('input[name="terms_accepted"]').check();
      await page.screenshot({ path: path.join('test-results', 'tc-079-form.png'), fullPage: true });
      await page.getByRole('button', { name: '確認報名' }).click();
      await page.waitForURL(/\/done\?hold=/, { timeout: 30_000 });

      const links = page.locator('[data-participant-link]');
      await expect(links).toHaveCount(2);
      // Each Participant gets their own Attendance QR card, and the Session can go in a calendar
      await expect(page.locator('[data-participant-card] img')).toHaveCount(2);
      const [ics] = await Promise.all([page.waitForEvent('download'), page.getByTestId('add-to-calendar').click()]);
      expect(ics.suggestedFilename()).toBe('2030-11-01-class.ics');
      await page.screenshot({ path: path.join('test-results', 'tc-079-done.png'), fullPage: true });

      const ids = await links.evaluateAll((els) => els.map((e) => e.getAttribute('data-participant-link')!));
      const first = (await convex('query', 'adminParticipants:getParticipantAdminDetails', {
        participant_id: ids[0],
      })) as Record<string, unknown>;
      expect(first).toMatchObject({
        name: '陳大文',
        mobile: '+85291079079',
        age: 35,
        height: 172,
        session_id: sessionId,
        emergency_contact_name: '陳太',
        emergency_contact_phone: '+85298079079',
      });
      const second = (await convex('query', 'adminParticipants:getParticipantAdminDetails', {
        participant_id: ids[1],
      })) as Record<string, unknown>;
      // Emergency contact defaults to participant 1's
      expect(second).toMatchObject({
        name: '陳小文',
        mobile: '+85296079079',
        emergency_contact_name: '陳太',
        session_id: sessionId,
      });

      // The Session now has 3 of 5 seats left
      const data = (await convex('query', 'applyPage:getApplyPageData', { class_id: classId })) as {
        sessions: Array<{ session_id: string; remaining_quota: number }>;
      };
      expect(data.sessions.find((s) => s.session_id === sessionId)?.remaining_quota).toBe(3);

      // The Participant Link works
      await links.first().click();
      await page.waitForURL(new RegExp(`/participant/${ids[0]}`));
    } finally {
      await convex('mutation', 'adminClasses:setClassStatus', {
        class_id: classId,
        status: 'inactive',
        admin_username: 'admin',
      });
    }
  });

  test('TC-079 age outside the Class Age Range is rejected on the form', async ({ page }) => {
    await page.goto(`${BASE_URL}/apply/class_cycling_kids`);
    await page.locator('[data-session-id]:not([disabled])').first().click();
    await page.locator('input[name="customer_mobile"]').fill('+85291079079');
    await page.locator('input[name="p0_name"]').fill('陳小明');
    await page.locator('input[name="p0_age"]').fill('15');
    await page.locator('input[name="p0_height"]').fill('150');
    await page.locator('input[name="p0_emergency_name"]').fill('陳太');
    await page.locator('input[name="p0_emergency_phone"]').fill('+85298079079');
    await page.locator('input[name="terms_accepted"]').check();
    await page.getByRole('button', { name: '確認並付款' }).click();
    await expect(page.getByText('此班適合 5–12 歲')).toBeVisible();
    // 幼兒班 never asks for the child's own mobile, and labels the contact as the parent
    await expect(page.locator('input[name="p0_mobile_same"]')).toHaveCount(0);
    await expect(page.getByText('家長或接送人').first()).toBeVisible();
  });
});
