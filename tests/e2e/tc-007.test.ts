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

test.describe('TC-007: QR code participant page — shows Maps link when URL is set', () => {
  test('TC-007 shows Get Directions link on participant page when session has google_maps_url', async ({ page }) => {
    const testId = Date.now();
    const GOOGLE_MAPS_URL = `https://maps.google.com/maps?q=tc007+test+location+${testId}`;

    // Step 1: Create a class via Convex
    const createdClass = await convexMutation('adminClasses:createClass', {
      name: `TC007 Class ${testId}`,
      description: 'Maps link participant page test',
      admin_username: 'admin',
    }) as { class_id: string };

    // Step 2: Create a session WITH a Google Maps URL via Convex
    const createdSession = await convexMutation('adminSessions:createSession', {
      class_id: createdClass.class_id,
      location: `TC007 Studio ${testId}`,
      date: '2030-12-20',
      time: '09:00',
      quota_defined: 10,
      admin_username: 'admin',
      google_maps_url: GOOGLE_MAPS_URL,
    }) as { session_id: string };

    // Step 3: Create a test purchase
    const purchase = await convexMutation('testPurchase:createTestPurchase', {
      customer_mobile: '+6599007007',
      participant_count: 1,
    }) as { token: string; purchase_id: string };

    // Step 4: Accept terms via Convex mutation directly (bypasses browser UI)
    // This creates participant records in the database
    const acceptResult = await convexMutation('terms:acceptTermsByToken', {
      token: purchase.token,
      session_id: createdSession.session_id,
      accepted: true,
    }) as { success: boolean; error_message?: string };

    if (!acceptResult.success) {
      throw new Error(`acceptTermsByToken failed: ${acceptResult.error_message}`);
    }

    // Step 5: Retrieve the participant_id created for this purchase
    const participants = await convexQuery('testPurchase:getParticipantsByToken', {
      token: purchase.token,
    }) as Array<{ participant_id: string; session_id: string }>;

    expect(participants.length).toBeGreaterThan(0);
    const participantId = participants[0].participant_id;

    // Step 6: Navigate to the participant page
    await page.goto(`${BASE_URL}/participant/${participantId}`);
    await page.waitForLoadState('networkidle');

    // Step 7: Verify "Get Directions" link is visible
    const directionsLink = page.getByRole('link', { name: 'Get Directions' });
    await expect(directionsLink).toBeVisible({ timeout: 15_000 });

    // Step 8: Verify the link href matches the stored Google Maps URL
    const href = await directionsLink.getAttribute('href');
    expect(href).toBe(GOOGLE_MAPS_URL);

    // Step 9: Take screenshot as evidence
    const screenshotDir = path.join(process.cwd(), 'test-results');
    await page.screenshot({ path: path.join(screenshotDir, 'tc-007-participant-directions-link.png'), fullPage: true });

    console.log('TC-007 evidence:', JSON.stringify({
      participant_id: participantId,
      session_id: createdSession.session_id,
      google_maps_url: GOOGLE_MAPS_URL,
      directions_link_visible: true,
      href_matches: href === GOOGLE_MAPS_URL,
    }, null, 2));
  });
});
