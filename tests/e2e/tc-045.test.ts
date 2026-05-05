import { test, expect } from '@playwright/test';

// TC-045: Rain-cancelled participant's Change Session modal only shows FUTURE sessions
// The future-date filter still applies — past-dated sessions must not appear.
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

test('TC-045: Rain-cancelled participant sees only future sessions in Change Session modal (past sessions excluded)', async ({ page }) => {
  const testId = Date.now();

  // Step 1: Create class with three sessions:
  //   - "Current" session (will be rain-cancelled): participant is enrolled here
  //   - "Past" session: date in the past, scheduled, quota available — must NOT appear
  //   - "Future" session: date in the future, scheduled, quota available — MUST appear
  const cls = await convexMutation('adminClasses:createClass', {
    name_zh: `TC045 Class ${testId}`,
    description: 'Rain cancel — future-date filter still applies',
    admin_username: 'admin',
  }) as { class_id: string };

  const currentSession = await convexMutation('adminSessions:createSession', {
    class_id: cls.class_id,
    location_zh: `TC045-Current-${testId}`,
    date: '2030-10-01',
    time: '09:00',
    quota_defined: 10,
    admin_username: 'admin',
  }) as { session_id: string };

  // Past-dated session — must NOT appear even for rain-cancelled participant
  await convexMutation('adminSessions:createSession', {
    class_id: cls.class_id,
    location_zh: `TC045-Past-${testId}`,
    date: '2020-01-15',
    time: '10:00',
    quota_defined: 10,
    admin_username: 'admin',
  });

  // Future session — must appear
  await convexMutation('adminSessions:createSession', {
    class_id: cls.class_id,
    location_zh: `TC045-Future-${testId}`,
    date: '2030-11-01',
    time: '11:00',
    quota_defined: 10,
    admin_username: 'admin',
  });

  // Step 2: Create participant in the current session
  const participant = await convexMutation('testPurchase:createTestParticipant', {
    session_id: currentSession.session_id,
    name: `TC045 Participant ${testId}`,
    mobile: '+60123000045',
  }) as { participant_id: string };

  // Step 3: Rain-cancel the current session
  await convexMutation('adminSessions:markSessionRainCancelled', {
    session_id: currentSession.session_id,
    admin_username: 'admin',
  });

  // Step 4: Navigate to participant pass page
  await page.goto(`${BASE_URL}/participant/${participant.participant_id}`);
  await page.waitForLoadState('networkidle');

  // Step 5: Assert amber rain banner is visible (confirms rain-cancelled state)
  await expect(page.locator('section.rounded-xl.border.border-amber-200')).toBeVisible({ timeout: 10_000 });

  // Step 6: Open Change Session modal
  const changeSessionBtn = page.getByRole('button', { name: '更改時段' });
  await expect(changeSessionBtn).toBeVisible({ timeout: 10_000 });
  await changeSessionBtn.click();
  await expect(page.getByRole('heading', { name: '更改時段' })).toBeVisible({ timeout: 10_000 });

  await page.screenshot({ path: 'tc045-modal-open.png', fullPage: true });

  // Step 7: Assert only the future session is shown — past session must NOT appear
  // The modal uses a <select> dropdown; get all option text and filter out the placeholder
  const allOptionTexts = (await page.locator('select#new_session_id option').allTextContents()).join(' ');
  const optionCount = (await page.locator('select#new_session_id option').count()) - 1; // minus placeholder

  // Future session MUST appear (location shown in option text)
  expect(allOptionTexts).toContain(`TC045-Future-${testId}`);

  // Past-dated session must NOT appear (future-date filter is still enforced)
  expect(allOptionTexts).not.toContain(`TC045-Past-${testId}`);

  // Current (rain-cancelled) session must NOT appear (it's the current session)
  expect(allOptionTexts).not.toContain(`TC045-Current-${testId}`);

  await page.screenshot({ path: 'tc045-evidence.png', fullPage: true });

  console.log('TC-045 evidence:', JSON.stringify({
    class_id: cls.class_id,
    current_session_id: currentSession.session_id,
    option_count: optionCount,
    future_session_visible: allOptionTexts.includes(`TC045-Future-${testId}`),
    past_session_visible: allOptionTexts.includes(`TC045-Past-${testId}`),
  }, null, 2));
});
