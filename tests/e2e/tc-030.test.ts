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

test.describe('TC-030: Terms form — emergency contact phone accepts valid international format', () => {
  test('TC-030 submitting the terms form with an international phone number succeeds', async ({ page }) => {
    const testId = Date.now();
    const screenshotDir = path.join(process.cwd(), 'test-results');

    // Step 1: Create a class and session for selection in the form
    const createdClass = await convexMutation('adminClasses:createClass', {
      name: `TC030 Class ${testId}`,
      description: 'International phone format test',
      admin_username: 'admin',
    }) as { class_id: string };

    const createdSession = await convexMutation('adminSessions:createSession', {
      class_id: createdClass.class_id,
      location: `TC030 Studio ${testId}`,
      date: '2030-12-25',
      time: '10:00',
      quota_defined: 10,
      admin_username: 'admin',
    }) as { session_id: string };

    console.log(`TC-030 setup: class=${createdClass.class_id} session=${createdSession.session_id}`);

    // Step 2: Create a test purchase (pending_terms) to get a valid token
    const purchase = await convexMutation('testPurchase:createTestPurchase', {
      customer_mobile: `+6030${testId.toString().slice(-7)}`,
      participant_count: 1,
    }) as { purchase_id: string; token: string };

    console.log(`TC-030 created test purchase token: ${purchase.token}`);

    // Step 3: Navigate to the terms acceptance page
    await page.goto(`${BASE_URL}/terms?token=${purchase.token}`);
    await page.waitForLoadState('networkidle', { timeout: 30_000 });

    // Screenshot of the form before filling
    await page.screenshot({ path: path.join(screenshotDir, 'tc-030-form-before.png'), fullPage: true });

    // Step 4: Select a session
    await page.locator('select[name="session_id"]').selectOption({ value: createdSession.session_id });
    console.log('TC-030: selected session');

    // Step 5: Fill in height
    await page.locator('input[name="height"]').fill('170cm');

    // Step 6: Fill in age
    await page.locator('input[name="age"]').fill('30');

    // Step 7: Fill in emergency contact name
    await page.locator('input[name="emergency_contact_name"]').fill('Jane Smith');

    // Step 8: Fill in emergency contact phone with international format
    await page.locator('input[name="emergency_contact_phone"]').fill('+447700900000');
    console.log('TC-030: filled emergency_contact_phone with +447700900000');

    // Step 9: Accept the terms checkbox
    await page.locator('input[name="accepted"]').check();

    // Screenshot showing filled form with international phone number
    await page.screenshot({ path: path.join(screenshotDir, 'tc-030-form-filled.png'), fullPage: true });

    // Step 10: Assert submit button is enabled (no phone validation error blocking it)
    const submitButton = page.getByRole('button', { name: 'Accept Terms' });
    await expect(submitButton).toBeEnabled({ timeout: 5_000 });
    console.log('TC-030: submit button is enabled — international phone format accepted');

    // Step 11: Submit the form
    await submitButton.click();

    // Step 12: Wait for success state
    await page.waitForURL(/status=success/, { timeout: 30_000 });
    await page.waitForLoadState('networkidle', { timeout: 15_000 });

    // Screenshot as evidence of successful submission
    await page.screenshot({ path: path.join(screenshotDir, 'tc-030-success.png'), fullPage: true });

    // Step 13: Assert success message is shown
    await expect(page.getByText('Terms accepted successfully.')).toBeVisible({ timeout: 10_000 });

    console.log('TC-030 evidence: form accepted international phone +447700900000 and submission succeeded');
    console.log('TC-030 PASS: emergency contact phone accepts valid international format');
  });
});
