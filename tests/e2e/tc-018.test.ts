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

test.describe('TC-018: Terms success state removes form fields after submission', () => {
  test('TC-018 after submitting terms form, form fields are absent and success state is shown', async ({ page }) => {
    const screenshotDir = path.join(process.cwd(), 'test-results');

    // Step 1: Create a test purchase
    const purchase = await convexMutation('testPurchase:createTestPurchase', {
      customer_mobile: '+6599018018',
      participant_count: 1,
    }) as { purchase_id: string; token: string };
    const token = purchase.token;
    console.log(`TC-018 created test purchase with token: ${token}`);

    // Step 2: Get terms page data to find an available session
    const termsData = await convexQuery('terms:getTermsPageData', { token }) as {
      sessions: Array<{ session_id: string; class_name: string; location: string; date: string; time: string }>;
    };
    if (!termsData || !termsData.sessions || termsData.sessions.length === 0) {
      throw new Error('TC-018: No available sessions found — cannot submit terms form');
    }
    const sessionId = termsData.sessions[0].session_id;
    console.log(`TC-018 using session_id: ${sessionId}`);

    // Step 3: Navigate to the terms page
    await page.goto(`${BASE_URL}/terms?token=${token}`);
    await page.waitForLoadState('networkidle', { timeout: 20_000 });

    // Step 4: Confirm form is visible before submission
    const sessionSelect = page.locator('select#session_id');
    await expect(sessionSelect).toBeVisible({ timeout: 15_000 });

    await page.screenshot({ path: path.join(screenshotDir, 'tc-018-before-submit.png'), fullPage: true });

    // Step 5: Fill out the terms form
    await sessionSelect.selectOption(sessionId);

    // Fill optional participant detail fields if present (feat/backlog-prd)
    const heightInput = page.locator('input#height');
    const ageInput = page.locator('input#age');
    const emergencyNameInput = page.locator('input#emergency_contact_name');
    const emergencyPhoneInput = page.locator('input#emergency_contact_phone');

    if (await heightInput.isVisible()) await heightInput.fill('170cm');
    if (await ageInput.isVisible()) await ageInput.fill('30');
    if (await emergencyNameInput.isVisible()) await emergencyNameInput.fill('Emergency Contact');
    if (await emergencyPhoneInput.isVisible()) await emergencyPhoneInput.fill('+60123456789');

    await page.locator('input[name="accepted"]').check();

    await page.screenshot({ path: path.join(screenshotDir, 'tc-018-form-filled.png'), fullPage: true });

    // Step 6: Submit the form
    await page.getByRole('button', { name: 'Accept Terms' }).click();

    // Step 7: Wait for redirect to success URL
    await page.waitForURL(/status=success/, { timeout: 30_000 });
    const successUrl = page.url();
    console.log(`TC-018 redirected to: ${successUrl}`);

    await page.waitForLoadState('networkidle', { timeout: 20_000 });

    // Step 8: Take success screenshot
    await page.screenshot({ path: path.join(screenshotDir, 'tc-018-success-state.png'), fullPage: true });

    // Step 9: Assert all form input fields are ABSENT
    await expect(page.locator('select#session_id')).toHaveCount(0);
    await expect(page.locator('input[name="accepted"]')).toHaveCount(0);
    await expect(page.locator('input#height')).toHaveCount(0);
    await expect(page.locator('input#age')).toHaveCount(0);
    await expect(page.locator('input#emergency_contact_name')).toHaveCount(0);
    await expect(page.locator('input#emergency_contact_phone')).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Accept Terms' })).toHaveCount(0);

    // Step 10: Assert session/terms detail blocks are absent
    // The form wrapper or terms-form section should not be present
    await expect(page.locator('form')).toHaveCount(0);

    // Step 11: Assert success state is shown (SVG tick + message + button)
    // The page shows: green check SVG + "Your class application is confirmed" h1 + "Open your QR Code" link
    await expect(page.getByRole('heading', { name: 'Your class application is confirmed' })).toBeVisible({ timeout: 10_000 });
    const qrButton = page.getByRole('link', { name: 'Open your QR Code' });
    await expect(qrButton).toBeVisible({ timeout: 10_000 });

    // Step 12: Verify URL contains status=success (client-side redirect, not full reload indicator)
    expect(page.url()).toContain('status=success');

    const pageContent = await page.textContent('body');
    console.log('TC-018 evidence:', JSON.stringify({
      token,
      session_id: sessionId,
      success_url: successUrl,
      form_absent: !pageContent?.includes('Accept Terms'),
      success_message_present: pageContent?.includes('Your class application is confirmed'),
      qr_button_visible: true,
    }, null, 2));
  });
});
