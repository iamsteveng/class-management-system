import { test, expect } from '@playwright/test';

const CONVEX_URL = 'https://graceful-mole-393.convex.cloud';

async function convexMutation(path: string, args: Record<string, unknown>) {
  const res = await fetch(`${CONVEX_URL}/api/mutation`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ path, args, format: 'json' }),
  });
  const json = await res.json() as { status: string; value?: unknown; errorMessage?: string };
  if (json.status !== 'success') throw new Error(`Mutation ${path} failed: ${json.errorMessage}`);
  return json.value;
}

async function convexQuery(apiPath: string, args: Record<string, unknown>) {
  const res = await fetch(`${CONVEX_URL}/api/query`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ path: apiPath, args, format: 'json' }),
  });
  const json = await res.json() as { status: string; value?: unknown; errorMessage?: string };
  if (json.status !== 'success') throw new Error(`Query ${apiPath} failed: ${json.errorMessage}`);
  return json.value;
}

function getFutureDate(daysFromNow: number): string {
  const d = new Date();
  d.setDate(d.getDate() + daysFromNow);
  return d.toISOString().slice(0, 10); // YYYY-MM-DD
}

test('TC-015: Change Session button hidden when <2 days', async ({ page }) => {
  // Step 1: Get an existing class_id from the system
  const classListData = await convexQuery('adminClasses:getClassListPageData', {}) as Array<{
    class_id: string;
    name: string;
  }>;

  expect(classListData.length, 'At least one class must exist in the system').toBeGreaterThan(0);
  const classId = classListData[0].class_id;

  // Step 2: Create a session with date = today + 1 day (<2 days away)
  const futureDate = getFutureDate(1);
  const sessionResult = await convexMutation('adminSessions:createSession', {
    class_id: classId,
    location: 'TC-015 Test Location',
    date: futureDate,
    time: '10:00',
    quota_defined: 10,
    admin_username: 'admin',
  }) as { session_id: string };

  const sessionId = sessionResult.session_id;
  expect(sessionId, 'Session must be created with an ID').toBeTruthy();

  // Step 3: Create a test purchase
  const purchaseResult = await convexMutation('testPurchase:createTestPurchase', {
    customer_mobile: '+6599015015',
  }) as { token: string; purchase_id: string };
  const token = purchaseResult.token;

  // Step 4: Accept terms for the near session (<2 days away)
  const acceptResult = await convexMutation('terms:acceptTermsByToken', {
    token,
    session_id: sessionId,
    accepted: true,
  }) as { success: boolean; error_message?: string };

  expect(acceptResult.success, `acceptTermsByToken failed: ${acceptResult.error_message}`).toBe(true);

  // Step 5: Get participant UUID
  const participants = await convexQuery('testPurchase:getParticipantsByToken', { token }) as Array<{
    participant_id: string;
    session_id: string;
  }>;

  expect(participants.length, 'Expected at least 1 participant').toBeGreaterThan(0);
  const participantId = participants[0].participant_id;

  // Step 6: Load participant page
  await page.goto(`/participant/${encodeURIComponent(participantId)}`);
  await page.waitForLoadState('networkidle');

  // Step 7: Verify "Change Session" button is NOT visible (session is <2 days away)
  const changeSessionButton = page.getByRole('button', { name: 'Change Session' });
  await expect(changeSessionButton).not.toBeVisible();

  // Evidence output
  console.log('TC-015 Evidence:', JSON.stringify({
    participant_id: participantId,
    session_id: sessionId,
    session_date: futureDate,
    days_from_now: 1,
    change_session_button_visible: false,
  }, null, 2));

  await page.screenshot({ file_path: 'e2e/tc015-screenshot.png', fullPage: true });
});
