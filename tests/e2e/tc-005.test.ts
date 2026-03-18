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

test.describe('TC-005: Admin session create — save without Google Maps URL (optional field)', () => {
  test('TC-005 creates a session without Google Maps URL and verifies google_maps_url is absent', async ({ page }) => {
    // Step 1: Create a class via Convex to have a target for session creation
    const createdClass = await convexMutation('adminClasses:createClass', {
      name: `TC005 Class ${Date.now()}`,
      description: 'Optional Google Maps URL test class',
      admin_username: 'admin',
    }) as { class_id: string };

    // Step 2: Log in as admin on the Vercel app
    await page.goto(`${BASE_URL}/admin/login`);
    await page.getByLabel('Username').fill('admin');
    await page.getByLabel('Password').fill('admin123');
    await page.getByRole('button', { name: 'Sign In' }).click();
    await page.waitForURL(/\/admin\/dashboard/, { timeout: 20_000 });

    // Step 3: Navigate to the class sessions page
    await page.goto(`${BASE_URL}/admin/classes/${createdClass.class_id}/sessions`);

    // Step 4: Open the Add Session modal
    await page.getByRole('button', { name: 'Add Session' }).click();

    // Step 5: Fill only required fields — deliberately leave Google Maps URL blank
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 21);
    const dateString = futureDate.toISOString().slice(0, 10);

    await page.fill('input[name="location"]', 'TC005 Studio C');
    await page.fill('input[name="date"]', dateString);
    await page.fill('input[name="time"]', '11:00');
    await page.fill('input[name="quota_defined"]', '10');

    // If the google_maps_url field exists in the form, leave it blank (do not fill it)
    // The field is optional per schema (v.optional(v.string()))

    // Step 6: Submit the form
    await page.getByRole('button', { name: 'Create' }).click();

    // Step 7: Wait for success redirect
    await page.waitForURL(/status=session_created/, { timeout: 20_000 });

    // Step 8: Take screenshot of created session list
    const screenshotDir = path.join(process.cwd(), 'test-results');
    await page.screenshot({ path: path.join(screenshotDir, 'tc-005-session-created.png'), fullPage: true });

    // Step 9: Verify the new session row is visible in the table
    const sessionRow = page.locator('tbody tr').filter({ hasText: 'TC005 Studio C' });
    await expect(sessionRow).toHaveCount(1, { timeout: 10_000 });

    // Step 10: Verify via Convex that google_maps_url is null/absent on the session record
    const pageData = await convexQuery('adminSessions:getSessionManagementPageData', {
      class_id: createdClass.class_id,
    }) as { sessions: Array<{ location: string; google_maps_url?: string }> } | null;

    expect(pageData).not.toBeNull();
    const sessions = pageData!.sessions;
    const tc005Session = sessions.find((s) => s.location === 'TC005 Studio C');
    expect(tc005Session).toBeDefined();
    expect(tc005Session!.google_maps_url == null || tc005Session!.google_maps_url === undefined).toBe(true);

    console.log('TC-005 evidence:', JSON.stringify({
      class_id: createdClass.class_id,
      location: 'TC005 Studio C',
      google_maps_url_on_record: tc005Session!.google_maps_url ?? null,
      session_created: true,
    }, null, 2));
  });
});
