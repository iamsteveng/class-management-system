import { test, expect } from '@playwright/test';

// TC-046: Participant with a past-dated non-rain session cannot change session (2-day rule still applies)
// Validates that the rain unlock is specific to rain cancellations — normal sessions respect the 2-day rule.
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

test('TC-046: Participant in a past-dated session (not rain-cancelled) cannot change session', async ({ page }) => {
  const testId = Date.now();

  // Step 1: Create class with a session in the past (2020) — not rain-cancelled, status stays scheduled
  // isMoreThanTwoDaysAway = false (past), isRainCancelled = false → canChangeSession = false
  const cls = await convexMutation('adminClasses:createClass', {
    name_zh: `TC046 Class ${testId}`,
    description: '2-day rule applies for non-rain sessions',
    admin_username: 'admin',
  }) as { class_id: string };

  const pastSession = await convexMutation('adminSessions:createSession', {
    class_id: cls.class_id,
    location_zh: `TC046-PastSession-${testId}`,
    date: '2020-03-15',
    time: '09:00',
    quota_defined: 10,
    admin_username: 'admin',
  }) as { session_id: string };

  // Step 2: Create participant in the past session
  const participant = await convexMutation('testPurchase:createTestParticipant', {
    session_id: pastSession.session_id,
    name: `TC046 Participant ${testId}`,
    mobile: '+60123000046',
  }) as { participant_id: string };

  // Step 3: Navigate to participant pass page — session is NOT rain-cancelled
  await page.goto(`${BASE_URL}/participant/${participant.participant_id}`);
  await page.waitForLoadState('networkidle');

  // Step 4: Assert the amber rain banner is NOT shown (this is not a rain cancellation)
  await expect(page.locator('section.rounded-xl.border.border-amber-200')).toHaveCount(0);

  // Step 5: Assert the "Change Session" button is NOT visible (can_change_session = false)
  await expect(page.getByRole('button', { name: 'Change Session' })).toHaveCount(0);

  // Step 6: Assert no Change Session modal/fieldset is present in the DOM
  await expect(page.locator('fieldset')).toHaveCount(0);

  await page.screenshot({ path: 'tc046-evidence.png', fullPage: true });

  console.log('TC-046 evidence:', JSON.stringify({
    class_id: cls.class_id,
    session_id: pastSession.session_id,
    participant_id: participant.participant_id,
    session_date: '2020-03-15 (past, not rain-cancelled)',
    rain_banner_shown: false,
    change_session_button_shown: false,
  }, null, 2));
});
