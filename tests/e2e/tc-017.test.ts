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

test.describe('TC-017: Open your QR Code links to correct /participant/[participant_id]', () => {
  test('TC-017 QR Code button href matches participant_id returned by terms submission mutation', async ({ page }) => {
    const screenshotDir = path.join(process.cwd(), 'test-results');

    // Step 1: Create a test purchase (participant_count=1 so only one participant is created)
    const purchase = await convexMutation('testPurchase:createTestPurchase', {
      customer_mobile: '+6599017017',
      participant_count: 1,
    }) as { purchase_id: string; token: string };
    const token = purchase.token;
    console.log(`TC-017 created test purchase with token: ${token}`);

    // Step 2: Get terms page data to find an available session
    const termsData = await convexQuery('terms:getTermsPageData', { token }) as {
      sessions: Array<{ session_id: string; class_name: string; location: string; date: string; time: string }>;
    };
    if (!termsData || !termsData.sessions || termsData.sessions.length === 0) {
      throw new Error('TC-017: No available sessions found — cannot submit terms form');
    }
    const sessionId = termsData.sessions[0].session_id;
    console.log(`TC-017 using session_id: ${sessionId}`);

    // Step 3: Navigate to the terms page
    await page.goto(`${BASE_URL}/terms?token=${token}`);
    await page.waitForLoadState('networkidle', { timeout: 20_000 });

    await page.screenshot({ path: path.join(screenshotDir, 'tc-017-terms-form.png'), fullPage: true });

    // Step 4: Fill out the terms form
    // Select session
    await page.locator('select#session_id').selectOption(sessionId);

    // Fill participant details (extra fields added in backlog-2 / feat/backlog-prd)
    const heightInput = page.locator('input#height');
    const ageInput = page.locator('input#age');
    const emergencyNameInput = page.locator('input#emergency_contact_name');
    const emergencyPhoneInput = page.locator('input#emergency_contact_phone');

    if (await heightInput.isVisible()) {
      await heightInput.fill('170cm');
    }
    if (await ageInput.isVisible()) {
      await ageInput.fill('30');
    }
    if (await emergencyNameInput.isVisible()) {
      await emergencyNameInput.fill('Emergency Contact');
    }
    if (await emergencyPhoneInput.isVisible()) {
      await emergencyPhoneInput.fill('+60123456789');
    }

    // Accept terms checkbox
    await page.locator('input[name="accepted"]').check();

    await page.screenshot({ path: path.join(screenshotDir, 'tc-017-form-filled.png'), fullPage: true });

    // Step 5: Submit the form
    await page.getByRole('button', { name: 'Accept Terms' }).click();

    // Step 6: Wait for redirect to success URL (may take time due to server action + WhatsApp scheduling)
    await page.waitForURL(/status=success/, { timeout: 30_000 });
    const successUrl = page.url();
    console.log(`TC-017 redirected to: ${successUrl}`);

    await page.waitForLoadState('networkidle', { timeout: 20_000 });

    // Step 7: Extract participant_id from the success URL
    const urlObj = new URL(successUrl);
    const participantIdFromUrl = urlObj.searchParams.get('participant_id');
    expect(participantIdFromUrl, 'participant_id should be present in success URL').toBeTruthy();
    console.log(`TC-017 participant_id from URL: ${participantIdFromUrl}`);

    // Step 8: Verify the 'Open your QR Code' button is visible
    const qrButton = page.getByRole('link', { name: 'Open your QR Code' });
    await expect(qrButton).toBeVisible({ timeout: 15_000 });

    // Step 9: Verify button href matches the participant_id from the URL
    const href = await qrButton.getAttribute('href');
    console.log(`TC-017 QR button href: ${href}`);
    expect(href).toBe(`/participant/${participantIdFromUrl}`);

    // Final screenshot as evidence
    await page.screenshot({ path: path.join(screenshotDir, 'tc-017-success-qr-button.png'), fullPage: true });

    console.log('TC-017 evidence:', JSON.stringify({
      token,
      session_id: sessionId,
      success_url: successUrl,
      participant_id_from_url: participantIdFromUrl,
      qr_button_href: href,
      href_matches_participant_id: href === `/participant/${participantIdFromUrl}`,
    }, null, 2));
  });
});
