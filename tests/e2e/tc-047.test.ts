import { test, expect } from '@playwright/test';

// TC-047: Rain-cancelled participant successfully changes to a future session
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

test('TC-047: Rain-cancelled participant can successfully change to a future session', async ({ page }) => {
  const testId = Date.now();

  // Step 1: Create class with two sessions — current (rain-cancelled) and target (future)
  const cls = await convexMutation('adminClasses:createClass', {
    name_zh: `TC047 Class ${testId}`,
    description: 'Rain cancel change session success flow',
    admin_username: 'admin',
  }) as { class_id: string };

  const currentSession = await convexMutation('adminSessions:createSession', {
    class_id: cls.class_id,
    location_zh: `TC047-Current-${testId}`,
    date: '2030-12-01',
    time: '09:00',
    quota_defined: 10,
    admin_username: 'admin',
  }) as { session_id: string };

  const targetSession = await convexMutation('adminSessions:createSession', {
    class_id: cls.class_id,
    location_zh: `TC047-Target-${testId}`,
    date: '2030-12-15',
    time: '10:00',
    quota_defined: 10,
    admin_username: 'admin',
  }) as { session_id: string };

  // Step 2: Create participant in the current session
  const participant = await convexMutation('testPurchase:createTestParticipant', {
    session_id: currentSession.session_id,
    name: `TC047 Participant ${testId}`,
    mobile: '+60123000047',
  }) as { participant_id: string };

  // Step 3: Rain-cancel the current session
  await convexMutation('adminSessions:markSessionRainCancelled', {
    session_id: currentSession.session_id,
    admin_username: 'admin',
  });

  // Step 4: Navigate to participant pass page
  await page.goto(`${BASE_URL}/participant/${participant.participant_id}`);
  await page.waitForLoadState('networkidle');

  // Step 5: Assert amber rain banner is visible
  await expect(page.locator('section.rounded-xl.border.border-amber-200')).toBeVisible({ timeout: 10_000 });

  // Step 6: Open Change Session modal
  const changeSessionBtn = page.getByRole('button', { name: '更改時段' });
  await expect(changeSessionBtn).toBeVisible({ timeout: 10_000 });
  await changeSessionBtn.click();
  await expect(page.getByRole('heading', { name: '更改時段' })).toBeVisible({ timeout: 10_000 });

  // Step 7: Select the target session via the dropdown (modal uses <select>, not radio buttons)
  const sessionSelect = page.locator('select#new_session_id');
  await expect(sessionSelect).toBeVisible({ timeout: 10_000 });
  await sessionSelect.selectOption(targetSession.session_id);

  await page.screenshot({ path: 'tc047-before-confirm.png', fullPage: true });

  // Step 8: Confirm the change — ZH save button is '確認'
  const confirmBtn = page.getByRole('button', { name: '確認' });
  await expect(confirmBtn).toBeVisible();
  await confirmBtn.click();

  // Step 9: Assert redirect to status=session_changed
  await page.waitForURL(/status=session_changed/, { timeout: 15_000 });
  await page.waitForLoadState('networkidle');

  await page.screenshot({ path: 'tc047-evidence.png', fullPage: true });

  // Step 10: Assert the page now shows the new session details (target session location)
  await expect(page.getByText(`TC047-Target-${testId}`)).toBeVisible({ timeout: 10_000 });

  // Step 11: Assert the rain banner is no longer shown (participant is now in a new session)
  await expect(page.locator('section.rounded-xl.border.border-amber-200')).toHaveCount(0);

  console.log('TC-047 evidence:', JSON.stringify({
    class_id: cls.class_id,
    original_session_id: currentSession.session_id,
    target_session_id: targetSession.session_id,
    participant_id: participant.participant_id,
    session_changed_redirect: true,
    new_session_location_visible: true,
    rain_banner_gone: true,
  }, null, 2));
});
