import { test, expect } from '@playwright/test';
import path from 'path';
import { withServerSecret } from './helpers/serverSecret';

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

async function convexQuery(fnPath: string, args: Record<string, unknown>) {
  const res = await fetch(`${CONVEX_URL}/api/query`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ path: fnPath, args: withServerSecret(fnPath, args), format: 'json' }),
  });
  const json = await res.json() as { status: string; value?: unknown; errorMessage?: string };
  if (json.status !== 'success') throw new Error(`Query ${fnPath} failed: ${json.errorMessage}`);
  return json.value;
}

test.describe('TC-017: Success page shows the Attendance QR and links to correct /participant/[participant_id]', () => {
  test('TC-017 details link href matches participant_id returned by terms submission mutation', async ({ page }) => {
    const screenshotDir = path.join(process.cwd(), 'test-results');

    // Step 0: Create a class and session so getTermsPageData returns sessions
    const testId = Date.now();
    const createdClass = await convexMutation('adminClasses:createClass', {
      name_zh: `TC017 Class ${testId}`,
      admin_username: 'admin',
    }) as { class_id: string };
    await convexMutation('adminSessions:createSession', {
      class_id: createdClass.class_id,
      location_zh: `TC017 Studio ${testId}`,
      date: '2030-12-25',
      time: '10:00',
      end_time: '12:00',
      quota_defined: 10,
      admin_username: 'admin',
      google_maps_url: 'https://maps.google.com/?q=tc017',
    });
    // A second Session of the same Class to change into from the success page
    const otherSession = await convexMutation('adminSessions:createSession', {
      class_id: createdClass.class_id,
      location_zh: `TC017 Other Studio ${testId}`,
      date: '2030-12-26',
      time: '14:00',
      quota_defined: 10,
      admin_username: 'admin',
    }) as { session_id: string };
    console.log(`TC-017 setup: class=${createdClass.class_id}`);

    // Step 1: Create a test purchase (participant_count=1 so only one participant is created)
    const purchase = await convexMutation('testPurchase:createTestPurchase', {
      customer_mobile: '+6599017017',
      participant_count: 1,
      class_id: createdClass.class_id,
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
    const sessionId = termsData.sessions.find((s) => s.session_id !== otherSession.session_id)!.session_id;
    console.log(`TC-017 using session_id: ${sessionId}`);

    // Step 3: Navigate to the terms page
    await page.goto(`${BASE_URL}/terms?token=${token}`);
    await page.waitForLoadState('networkidle', { timeout: 20_000 });

    await page.screenshot({ path: path.join(screenshotDir, 'tc-017-terms-form.png'), fullPage: true });

    // Step 4: Fill out the terms form
    // Select session
    await page.locator('select#session_id').selectOption(sessionId);

    // Fill required participant detail fields
    await page.locator('input#name').fill('Test Participant');
    await page.locator('input#participant_mobile').fill('+60123456789');
    await page.locator('input#email').fill('test@example.com');
    await page.locator('input#height').fill('170');
    await page.locator('input#age').fill('30');
    await page.locator('input#emergency_contact_name').fill('Emergency Contact');
    await page.locator('input#emergency_contact_phone').fill('+60198765432');

    // Accept terms checkbox
    await page.locator('input[name="accepted"]').check();

    await page.screenshot({ path: path.join(screenshotDir, 'tc-017-form-filled.png'), fullPage: true });

    // Step 5: Submit the form
    await page.getByRole('button', { name: '接受條款' }).click();

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

    // Step 8: Verify the details link is visible (zh-TW default text)
    const qrButton = page.getByRole('link', { name: '查看我的課程詳情' });
    await expect(qrButton).toBeVisible({ timeout: 15_000 });

    // Step 9: Verify button href matches the participant_id from the URL
    const href = await qrButton.getAttribute('href');
    console.log(`TC-017 QR button href: ${href}`);
    expect(href).toBe(`/participant/${participantIdFromUrl}`);

    // Step 10: Attendance QR card is shown inline, with the keep-it reminder directly above it
    const reminder = page.getByTestId('attendance-qr-reminder');
    const card = page.getByTestId('attendance-qr-card');
    await expect(reminder).toBeVisible();
    await expect(card).toBeVisible();
    await expect(card.getByRole('img')).toBeVisible();
    await expect(page.getByRole('button', { name: '儲存 QR 碼' })).toBeVisible();
    const reminderBox = await reminder.boundingBox();
    const cardBox = await card.boundingBox();
    expect(reminderBox!.y + reminderBox!.height).toBeLessThanOrEqual(cardBox!.y + 1);

    // Step 11: Session date (with weekday), time and location on the card, plus the map button
    await expect(page.getByTestId('attendance-qr-datetime')).toHaveText('2030-12-25（星期三）10:00–12:00');
    await expect(page.getByTestId('attendance-qr-location')).toHaveText(`TC017 Studio ${testId}`);
    const mapButton = card.getByRole('link', { name: /Google Map/ });
    await expect(mapButton).toHaveAttribute('href', 'https://maps.google.com/?q=tc017');
    await expect(mapButton).toHaveAttribute('target', '_blank');

    // Step 12: Change Session from the success page; the card updates and asks to save again
    await page.getByRole('button', { name: '更改時段' }).click();
    await page.locator('select#new_session_id').selectOption(otherSession.session_id);
    await page.getByRole('button', { name: '確認' }).click();
    await page.waitForURL(/session_changed=1/, { timeout: 30_000 });
    await expect(page.getByText('你的時段已更改，請重新儲存 QR 碼。')).toBeVisible();
    await expect(page.getByTestId('attendance-qr-datetime')).toHaveText('2030-12-26（星期四）14:00');
    await expect(page.getByTestId('attendance-qr-location')).toHaveText(`TC017 Other Studio ${testId}`);
    await expect(card.getByRole('link', { name: /Google Map/ })).toHaveCount(0);

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
