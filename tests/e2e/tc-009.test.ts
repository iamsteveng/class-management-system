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

test.describe('TC-009: QR code participant page — Maps link opens in new tab', () => {
  test('TC-009 directions link has target="_blank" when google_maps_url is set', async ({ page }) => {
    const testId = Date.now();
    const mapsUrl = `https://maps.google.com/?q=TC009+Studio+${testId}`;

    // Step 1: Create a class
    const createdClass = await convexMutation('adminClasses:createClass', {
      name: `TC009 Class ${testId}`,
      description: 'Maps link new tab test',
      admin_username: 'admin',
    }) as { class_id: string };

    // Step 2: Create a session WITH a Google Maps URL
    const createdSession = await convexMutation('adminSessions:createSession', {
      class_id: createdClass.class_id,
      location: `TC009 Studio ${testId}`,
      date: '2030-12-22',
      time: '10:00',
      quota_defined: 10,
      admin_username: 'admin',
      google_maps_url: mapsUrl,
    }) as { session_id: string };

    // Step 3: Create a test purchase
    const purchase = await convexMutation('testPurchase:createTestPurchase', {
      customer_mobile: '+6599009009',
      participant_count: 1,
    }) as { token: string; purchase_id: string };

    // Step 4: Accept terms to create a participant
    const acceptResult = await convexMutation('terms:acceptTermsByToken', {
      token: purchase.token,
      session_id: createdSession.session_id,
      accepted: true,
    }) as { success: boolean; error_message?: string };

    if (!acceptResult.success) {
      throw new Error(`acceptTermsByToken failed: ${acceptResult.error_message}`);
    }

    // Step 5: Get participant_id
    const participants = await convexQuery('testPurchase:getParticipantsByToken', {
      token: purchase.token,
    }) as Array<{ participant_id: string; session_id: string }>;

    expect(participants.length).toBeGreaterThan(0);
    const participantId = participants[0].participant_id;

    // Step 6: Navigate to participant page
    await page.goto(`${BASE_URL}/participant/${participantId}`);
    await page.waitForLoadState('networkidle');

    // Step 7: Find the directions link
    const directionsLink = page.getByRole('link', { name: 'Get Directions' });
    await expect(directionsLink).toBeVisible({ timeout: 15_000 });

    // Step 8: Assert target="_blank"
    const target = await directionsLink.getAttribute('target');
    expect(target, 'Directions link must have target="_blank"').toBe('_blank');

    // Step 9: Also assert rel="noopener noreferrer" for security
    const rel = await directionsLink.getAttribute('rel');
    expect(rel, 'Directions link must have rel="noopener noreferrer"').toContain('noopener');

    // Evidence output
    console.log('TC-009 evidence:', JSON.stringify({
      participant_id: participantId,
      session_id: createdSession.session_id,
      google_maps_url: mapsUrl,
      target_attribute: target,
      rel_attribute: rel,
    }, null, 2));

    // Screenshot
    const screenshotDir = path.join(process.cwd(), 'test-results');
    await page.screenshot({ path: path.join(screenshotDir, 'tc-009-participant-directions-new-tab.png'), fullPage: true });
  });
});
