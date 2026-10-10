import { test, expect } from '@playwright/test';
import path from 'path';

import { fillTestCard } from './helpers/applyFixture';
import { withServerSecret } from './helpers/serverSecret';

// TC-081: Paid booking by card through the Airwallex demo environment. The Customer pays
// by card and lands on the done page with a Participant Link; the Session's seat is used.

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

test('TC-081 paid booking by card seats the Participant', async ({ page }) => {
  test.setTimeout(120_000);
  const testId = Date.now();
  const { class_id: classId } = (await convex('mutation', 'adminClasses:createClass', {
    name_zh: `TC081 Class ${testId}`,
    airwallex_price: 10,
    airwallex_currency: 'HKD',
    admin_username: 'admin',
  })) as { class_id: string };
  const { session_id: sessionId } = (await convex('mutation', 'adminSessions:createSession', {
    class_id: classId,
    location_zh: `TC081 Venue ${testId}`,
    date: '2030-11-01',
    time: '10:00',
    quota_defined: 2,
    admin_username: 'admin',
  })) as { session_id: string };

  try {
    await page.goto(`${BASE_URL}/apply/${classId}?session=${sessionId}`);
    await page.locator('input[name="customer_mobile"]').fill('+85291081081');
    await page.locator('input[name="p0_name"]').fill('Card Tester');
    await page.locator('input[name="p0_age"]').fill('40');
    await page.locator('input[name="p0_height"]').fill('175');
    await page.locator('input[name="p0_emergency_name"]').fill('Contact');
    await page.locator('input[name="p0_emergency_phone"]').fill('+85298081081');
    await page.locator('input[name="terms_accepted"]').check();
    await fillTestCard(page);

    await page.getByRole('button', { name: '確認並付款' }).click();
    await page.waitForURL(/\/done\?hold=/, { timeout: 60_000 });
    await expect(page.locator('[data-participant-link]')).toHaveCount(1);
    await page.screenshot({ path: path.join('test-results', 'tc-081-done.png') });

    const data = (await convex('query', 'applyPage:getApplyPageData', { class_id: classId })) as {
      sessions: Array<{ session_id: string; remaining_quota: number }>;
    };
    expect(data.sessions.find((s) => s.session_id === sessionId)?.remaining_quota).toBe(1);
  } finally {
    await convex('mutation', 'adminClasses:setClassStatus', {
      class_id: classId,
      status: 'inactive',
      admin_username: 'admin',
    });
  }
});
