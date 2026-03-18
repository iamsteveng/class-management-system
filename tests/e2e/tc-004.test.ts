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

test.describe('TC-004: Admin session create — save with Google Maps URL', () => {
  test('TC-004 creates a session with Google Maps URL and verifies it is pre-filled in the edit form', async ({ page }) => {
    // Step 1: Create a class via Convex to have a target for session creation
    const createdClass = await convexMutation('adminClasses:createClass', {
      name: `TC004 Class ${Date.now()}`,
      description: 'Google Maps URL test class',
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

    // Step 5: Fill all required fields and the Google Maps URL
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 14);
    const dateString = futureDate.toISOString().slice(0, 10);

    await page.fill('input[name="location"]', 'TC004 Studio B');
    await page.fill('input[name="date"]', dateString);
    await page.fill('input[name="time"]', '10:00');
    await page.fill('input[name="quota_defined"]', '15');

    const googleMapsUrl = 'https://maps.google.com/?q=TC004+Studio+B';
    await page.fill('input[name="google_maps_url"]', googleMapsUrl);

    // Step 6: Submit the form
    await page.getByRole('button', { name: 'Create' }).click();

    // Step 7: Wait for redirect to ?status=session_created
    await page.waitForURL(/status=session_created/, { timeout: 20_000 });

    // Step 8: Take screenshot of saved session list
    const screenshotDir = path.join(process.cwd(), 'test-results');
    await page.screenshot({ path: path.join(screenshotDir, 'tc-004-session-created.png'), fullPage: true });

    // Step 9: Verify the new session row is visible in the table
    const sessionRow = page.locator('tbody tr').filter({ hasText: 'TC004 Studio B' });
    await expect(sessionRow).toHaveCount(1, { timeout: 10_000 });

    // Step 10: Open the Edit modal for the new session row
    await sessionRow.getByRole('button', { name: 'Edit' }).click();

    // Step 11: Wait for the Edit Session modal to appear
    await expect(page.getByRole('heading', { name: 'Edit Session' })).toBeVisible({ timeout: 10_000 });

    // Step 12: Verify the Google Maps URL is pre-filled in the edit form
    const googleMapsInput = page.locator('input[name="google_maps_url"]');
    await expect(googleMapsInput).toHaveValue(googleMapsUrl, { timeout: 5_000 });

    // Step 13: Take screenshot of pre-filled edit form
    await page.screenshot({ path: path.join(screenshotDir, 'tc-004-edit-form-prefilled.png'), fullPage: true });

    console.log('TC-004 evidence:', JSON.stringify({
      class_id: createdClass.class_id,
      location: 'TC004 Studio B',
      google_maps_url_entered: googleMapsUrl,
      session_created: true,
      edit_form_prefilled: true,
    }, null, 2));
  });
});
