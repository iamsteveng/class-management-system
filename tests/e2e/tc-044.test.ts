import { test, expect } from '@playwright/test';

// TC-044: Participant sees amber rain banner when their session is rain-cancelled
// Targets: feat/rain-cancellation-change-session branch (localhost:3000)
const CONVEX_URL = 'https://graceful-mole-393.convex.cloud';
const BASE_URL = 'http://localhost:3000';

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

test('TC-044: Participant sees amber rain banner when session is rain-cancelled', async ({ page }) => {
  const testId = Date.now();

  // Step 1: Create class, session, and participant
  const cls = await convexMutation('adminClasses:createClass', {
    name_zh: `TC044 Class ${testId}`,
    description: 'Participant rain banner test',
    admin_username: 'admin',
  }) as { class_id: string };

  const session = await convexMutation('adminSessions:createSession', {
    class_id: cls.class_id,
    location_zh: `TC044-Session-${testId}`,
    date: '2030-09-10',
    time: '09:00',
    quota_defined: 10,
    admin_username: 'admin',
  }) as { session_id: string };

  const participant = await convexMutation('testPurchase:createTestParticipant', {
    session_id: session.session_id,
    name: `TC044 Participant ${testId}`,
    mobile: '+60123000044',
  }) as { participant_id: string };

  // Step 2: Mark the session as rain-cancelled via backend mutation
  await convexMutation('adminSessions:markSessionRainCancelled', {
    session_id: session.session_id,
    admin_username: 'admin',
  });

  // Step 3: Navigate to the participant pass page (no auth required)
  await page.goto(`${BASE_URL}/participant/${participant.participant_id}`);
  await page.waitForLoadState('networkidle');

  // Step 4: Assert the amber rain banner is visible
  const rainBanner = page.locator('section.rounded-xl.border.border-amber-200');
  await expect(rainBanner).toBeVisible({ timeout: 10_000 });

  // Step 5: Assert banner contains the rain-cancelled title (ZH default)
  await expect(rainBanner.locator('h2')).toContainText('課堂因惡劣天氣取消');

  // Step 6: Assert banner contains the instructional message (ZH default)
  await expect(rainBanner.locator('p')).toContainText('大雨或颱風');

  await page.screenshot({ path: 'tc044-evidence.png', fullPage: true });

  console.log('TC-044 evidence:', JSON.stringify({
    class_id: cls.class_id,
    session_id: session.session_id,
    participant_id: participant.participant_id,
    rain_banner_visible: true,
  }, null, 2));
});
