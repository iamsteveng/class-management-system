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

test.describe('TC-006: Admin session edit — update Google Maps URL on existing session', () => {
  test('TC-006 updates Google Maps URL on an existing session and verifies it is pre-filled on reload', async ({ page }) => {
    const testId = Date.now();
    const GOOGLE_MAPS_URL = 'https://maps.google.com/maps?q=tc006+test+location';

    // Step 1: Create a class via Convex
    const createdClass = await convexMutation('adminClasses:createClass', {
      name: `TC006 Class ${testId}`,
      description: 'Google Maps URL edit test class',
      admin_username: 'admin',
    }) as { class_id: string };

    // Step 2: Create a session without a Google Maps URL via Convex
    const createdSession = await convexMutation('adminSessions:createSession', {
      class_id: createdClass.class_id,
      location: `TC006 Studio ${testId}`,
      date: '2030-12-15',
      time: '10:00',
      quota_defined: 10,
      admin_username: 'admin',
    }) as { session_id: string };

    // Step 3: Log in as admin on the Vercel app
    await page.goto(`${BASE_URL}/admin/login`);
    await page.getByLabel('Username').fill('admin');
    await page.getByLabel('Password').fill('admin123');
    await page.getByRole('button', { name: 'Sign In' }).click();
    await page.waitForURL(/\/admin\/dashboard/, { timeout: 20_000 });

    // Step 4: Navigate to the class sessions page
    await page.goto(`${BASE_URL}/admin/classes/${createdClass.class_id}/sessions`);
    await page.waitForLoadState('networkidle');

    // Step 5: Find the session row and click Edit
    const sessionRow = page.locator('tbody tr').filter({ hasText: `TC006 Studio ${testId}` });
    await expect(sessionRow).toHaveCount(1, { timeout: 10_000 });
    await sessionRow.getByRole('button', { name: 'Edit' }).click();

    // Step 6: Verify the modal is open and Google Maps URL field is empty
    const mapsUrlInput = page.locator('input[name="google_maps_url"]');
    await expect(mapsUrlInput).toBeVisible({ timeout: 5_000 });
    await expect(mapsUrlInput).toHaveValue('');

    // Step 7: Enter a Google Maps URL
    await mapsUrlInput.fill(GOOGLE_MAPS_URL);

    // Step 8: Save the form
    await page.getByRole('button', { name: 'Save' }).click();

    // Step 9: Wait for the success redirect
    await page.waitForURL(/status=session_updated/, { timeout: 20_000 });

    // Step 10: Reload the page to get fresh server-rendered data
    await page.goto(`${BASE_URL}/admin/classes/${createdClass.class_id}/sessions`);
    await page.waitForLoadState('networkidle');

    // Step 11: Open the edit modal again for the same session
    const sessionRowAfterReload = page.locator('tbody tr').filter({ hasText: `TC006 Studio ${testId}` });
    await expect(sessionRowAfterReload).toHaveCount(1, { timeout: 10_000 });
    await sessionRowAfterReload.getByRole('button', { name: 'Edit' }).click();

    // Step 12: Verify Google Maps URL is pre-filled with the entered value
    const mapsUrlInputAfterReload = page.locator('input[name="google_maps_url"]');
    await expect(mapsUrlInputAfterReload).toBeVisible({ timeout: 5_000 });
    await expect(mapsUrlInputAfterReload).toHaveValue(GOOGLE_MAPS_URL);

    // Step 13: Take screenshot of pre-filled edit form
    const screenshotDir = path.join(process.cwd(), 'test-results');
    await page.screenshot({ path: path.join(screenshotDir, 'tc-006-google-maps-prefilled.png'), fullPage: true });

    console.log('TC-006 evidence:', JSON.stringify({
      class_id: createdClass.class_id,
      session_id: createdSession.session_id,
      location: `TC006 Studio ${testId}`,
      google_maps_url_verified: GOOGLE_MAPS_URL,
    }, null, 2));
  });
});
