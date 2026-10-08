import { test, expect, type Page } from '@playwright/test';

// TC-083: Admin screens for the revamp. Super Admins manage Venues and see the new Class
// fields; Regular Admins can view Venues but not edit them; the roster shows what the
// Customer entered for each Participant.

const CONVEX_URL = 'https://graceful-mole-393.convex.cloud';
const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

async function convex(kind: 'mutation' | 'query', fnPath: string, args: Record<string, unknown>) {
  const res = await fetch(`${CONVEX_URL}/api/${kind}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ path: fnPath, args, format: 'json' }),
  });
  const json = (await res.json()) as { status: string; value?: unknown; errorMessage?: string };
  if (json.status !== 'success') throw new Error(`${fnPath} failed: ${json.errorMessage}`);
  return json.value;
}

async function login(page: Page, username: string, password: string) {
  await page.goto(`${BASE_URL}/admin/login`);
  await page.getByLabel('Username').fill(username);
  await page.getByLabel('Password').fill(password);
  await page.getByRole('button', { name: 'Sign In' }).click();
  await page.waitForURL(/\/admin\/dashboard/, { timeout: 20_000 });
}

test.describe('TC-083: revamp admin screens', () => {
  test('TC-083 Super Admin sees Venues, the Timetable and the new Class fields', async ({ page }) => {
    await login(page, 'admin', 'admin123');
    await page.goto(`${BASE_URL}/admin/venues`);
    await expect(page.locator('[data-venue-id="venue_ty"]')).toContainText('青衣');
    await page.locator('[data-venue-id="venue_ty"]').getByRole('link', { name: 'Edit' }).click();
    await expect(page.locator('input[name="name_zh"]')).toHaveValue('青衣樂區單車亭');
    await expect(page.locator('input[name="walk_minutes"]')).toHaveValue('16');

    await page.goto(`${BASE_URL}/admin/timetable`);
    await expect(page.locator('[data-entry-id]')).toHaveCount(40);

    await page.goto(`${BASE_URL}/admin/classes`);
    const row = page.locator('tr', { hasText: 'class_cycling_kids' }).first();
    await row.getByRole('button', { name: 'Edit' }).click();
    await expect(page.locator('input[name="age_min"]')).toHaveValue('5');
    await expect(page.locator('input[name="age_max"]')).toHaveValue('12');
    await expect(page.locator('input[name="class_size"]')).toHaveValue('6');
    await expect(page.locator('input[name="image_url"]')).toHaveValue('/images/revamp/class-kids.jpg');
  });

  test('TC-083 Regular Admin can view Venues but not edit them', async ({ page }) => {
    await login(page, 'staff', 'staff123');
    await page.goto(`${BASE_URL}/admin/venues`);
    await expect(page.locator('[data-venue-id="venue_ty"]')).toBeVisible();
    await expect(page.getByRole('link', { name: 'Edit' })).toHaveCount(0);
    await expect(page.getByRole('link', { name: 'Add Venue' })).toHaveCount(0);
  });

  test('TC-083 roster shows what the Customer entered', async ({ page, request }) => {
    const testId = Date.now();
    const { class_id: classId } = (await convex('mutation', 'adminClasses:createClass', {
      name_zh: `TC083 Class ${testId}`,
      is_free: true,
      admin_username: 'admin',
    })) as { class_id: string };
    const { session_id: sessionId } = (await convex('mutation', 'adminSessions:createSession', {
      class_id: classId,
      location_zh: '',
      venue_id: 'venue_ty',
      date: '2030-11-01',
      time: '10:00',
      quota_defined: 4,
      admin_username: 'admin',
    })) as { session_id: string };

    try {
      const res = await request.post(`${BASE_URL}/api/checkout/start`, {
        data: {
          request_id: crypto.randomUUID(),
          class_id: classId,
          session_id: sessionId,
          customer_mobile: '+85291083083',
          participants: [
            {
              name: 'Roster Person',
              age: 44,
              height: 168,
              riding_experience: 'short_distance',
              mobile: '+85291083083',
              emergency_contact_name: 'Someone',
              emergency_contact_phone: '+85298083083',
              health_notes: 'Knee injury',
              photo_consent: true,
            },
          ],
          terms_accepted: true,
        },
      });
      expect((await res.json()).kind).toBe('completed');

      await login(page, 'admin', 'admin123');
      await page.goto(`${BASE_URL}/admin/sessions/${sessionId}/participants`);
      const row = page.locator('tr', { hasText: 'Roster Person' });
      await expect(row).toContainText('44');
      await expect(row).toContainText('Short distances');
      await expect(row).toContainText('Knee injury');
      await expect(row).toContainText('Yes (by Customer)');
    } finally {
      await convex('mutation', 'adminClasses:setClassStatus', {
        class_id: classId,
        status: 'inactive',
        admin_username: 'admin',
      });
    }
  });
});
