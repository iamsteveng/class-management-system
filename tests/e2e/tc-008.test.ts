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

test.describe('TC-008: QR code participant page — no Maps link when URL is not set', () => {
  test('TC-008 does not show Get Directions link when session has no google_maps_url', async ({ page }) => {
    const testId = Date.now();

    // Step 1: Create a class via Convex
    const createdClass = await convexMutation('adminClasses:createClass', {
      name: `TC008 Class ${testId}`,
      description: 'No maps link participant page test',
      admin_username: 'admin',
    }) as { class_id: string };

    // Step 2: Create a session WITHOUT a Google Maps URL
    const createdSession = await convexMutation('adminSessions:createSession', {
      class_id: createdClass.class_id,
      location: `TC008 Studio ${testId}`,
      date: '2030-12-21',
      time: '10:00',
      quota_defined: 10,
      admin_username: 'admin',
      // intentionally omitting google_maps_url
    }) as { session_id: string };

    // Step 3: Create a test purchase
    const purchase = await convexMutation('testPurchase:createTestPurchase', {
      customer_mobile: '+6599008008',
      participant_count: 1,
    }) as { token: string; purchase_id: string };

    // Step 4: Accept terms via Convex mutation directly
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

    // Step 7: Verify "Get Directions" link is NOT present
    const directionsLink = page.getByRole('link', { name: 'Get Directions' });
    await expect(directionsLink).not.toBeVisible({ timeout: 15_000 });

    // Step 8: Verify no broken/empty link elements related to maps
    const emptyLinks = page.locator('a[href=""]');
    await expect(emptyLinks).toHaveCount(0);

    // Step 9: Take screenshot as evidence
    const screenshotDir = path.join(process.cwd(), 'test-results');
    await page.screenshot({ path: path.join(screenshotDir, 'tc-008-participant-no-directions-link.png'), fullPage: true });

    console.log('TC-008 evidence:', JSON.stringify({
      participant_id: participantId,
      session_id: createdSession.session_id,
      google_maps_url: null,
      directions_link_visible: false,
    }, null, 2));
  });
});
