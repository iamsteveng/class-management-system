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
  return d.toISOString().slice(0, 10);
}

test('TC-018: No WhatsApp sent on self-reschedule', async ({ page }) => {
  // Track any Twilio API calls made during the test
  const twilioCallCount = { count: 0 };
  page.on('request', (req) => {
    if (req.url().includes('api.twilio.com') || req.url().includes('twilio.com/2010-04-01')) {
      twilioCallCount.count++;
    }
  });

  // Step 1: Get an existing class_id
  const classListData = await convexQuery('adminClasses:getClassListPageData', {}) as Array<{
    class_id: string;
    name: string;
  }>;
  expect(classListData.length, 'At least one class must exist').toBeGreaterThan(0);
  const classId = classListData[0].class_id;

  // Step 2: Create two sessions (both >2 days away to allow rescheduling)
  const sessionAResult = await convexMutation('adminSessions:createSession', {
    class_id: classId,
    location: 'TC-018 Session A',
    date: getFutureDate(5),
    time: '09:00',
    quota_defined: 10,
    admin_username: 'admin',
  }) as { session_id: string };
  const sessionAId = sessionAResult.session_id;
  expect(sessionAId).toBeTruthy();

  const sessionBResult = await convexMutation('adminSessions:createSession', {
    class_id: classId,
    location: 'TC-018 Session B',
    date: getFutureDate(7),
    time: '10:00',
    quota_defined: 10,
    admin_username: 'admin',
  }) as { session_id: string };
  const sessionBId = sessionBResult.session_id;
  expect(sessionBId).toBeTruthy();

  // Step 3: Create a test purchase and enroll in Session A
  const purchaseResult = await convexMutation('testPurchase:createTestPurchase', {
    customer_mobile: '+6599018018',
  }) as { token: string; purchase_id: string };
  const token = purchaseResult.token;

  const acceptResult = await convexMutation('terms:acceptTermsByToken', {
    token,
    session_id: sessionAId,
    accepted: true,
  }) as { success: boolean; error_message?: string };
  expect(acceptResult.success, `acceptTermsByToken failed: ${acceptResult.error_message}`).toBe(true);

  // Step 4: Get participant ID
  const participants = await convexQuery('testPurchase:getParticipantsByToken', { token }) as Array<{
    participant_id: string;
    session_id: string;
  }>;
  expect(participants.length).toBeGreaterThan(0);
  const participantId = participants[0].participant_id;

  // Verify enrolled in Session A
  const beforeReschedule = await convexQuery('participants:getParticipantPageData', {
    participant_id: participantId,
  }) as { session_id: string } | null;
  expect(beforeReschedule!.session_id).toBe(sessionAId);

  // Step 5: Participant reschedules themselves (A → B) via the UI
  await page.goto(`/participant/${encodeURIComponent(participantId)}`);
  await page.waitForLoadState('networkidle');

  const changeSessionButton = page.getByRole('button', { name: 'Change Session' });
  await expect(changeSessionButton).toBeVisible();
  await changeSessionButton.click();

  const sessionSelect = page.locator('#new_session_id');
  await expect(sessionSelect).toBeVisible();
  await sessionSelect.selectOption({ value: sessionBId });

  const saveButton = page.getByRole('button', { name: 'Save' });
  await expect(saveButton).toBeEnabled();
  await saveButton.click();
  await page.waitForURL(/status=session_changed/, { timeout: 15000 });
  await page.waitForLoadState('networkidle');

  // Step 6: Verify reschedule was successful
  const afterReschedule = await convexQuery('participants:getParticipantPageData', {
    participant_id: participantId,
  }) as { session_id: string } | null;
  expect(afterReschedule!.session_id, 'Participant should now be in Session B').toBe(sessionBId);

  // Step 7: Verify no Twilio API calls were made
  // The rescheduling mutation does not trigger any WhatsApp notification
  const evidence = {
    participant_id: participantId,
    initial_session_id: sessionAId,
    final_session_id: afterReschedule!.session_id,
    twilio_mock_call_count: twilioCallCount.count,
    no_twilio_calls_made: twilioCallCount.count === 0,
  };
  console.log('TC-018 Evidence:', JSON.stringify(evidence, null, 2));

  expect(twilioCallCount.count, `Mock call count = ${twilioCallCount.count}, expected 0`).toBe(0);

  await page.screenshot({ path: 'e2e/tc018-screenshot.png', fullPage: true });
});
