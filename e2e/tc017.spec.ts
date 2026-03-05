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

async function rescheduleParticipant(
  page: import('@playwright/test').Page,
  participantId: string,
  targetSessionId: string
) {
  await page.goto(`/participant/${encodeURIComponent(participantId)}`);
  await page.waitForLoadState('networkidle');

  const changeSessionButton = page.getByRole('button', { name: 'Change Session' });
  await expect(changeSessionButton).toBeVisible();
  await changeSessionButton.click();

  const sessionSelect = page.locator('#new_session_id');
  await expect(sessionSelect).toBeVisible();
  await sessionSelect.selectOption({ value: targetSessionId });

  const saveButton = page.getByRole('button', { name: 'Save' });
  await expect(saveButton).toBeEnabled();
  await saveButton.click();
  await page.waitForURL(/status=session_changed/, { timeout: 15000 });
  await page.waitForLoadState('networkidle');
}

test('TC-017: Unlimited rescheduling allowed within window', async ({ page }) => {
  // Step 1: Get an existing class_id
  const classListData = await convexQuery('adminClasses:getClassListPageData', {}) as Array<{
    class_id: string;
    name: string;
  }>;
  expect(classListData.length, 'At least one class must exist').toBeGreaterThan(0);
  const classId = classListData[0].class_id;

  // Step 2: Create sessions A, B, C (all >2 days away to allow rescheduling)
  const sessionAResult = await convexMutation('adminSessions:createSession', {
    class_id: classId,
    location: 'TC-017 Session A',
    date: getFutureDate(5),
    time: '09:00',
    quota_defined: 10,
    admin_username: 'admin',
  }) as { session_id: string };
  const sessionAId = sessionAResult.session_id;
  expect(sessionAId).toBeTruthy();

  const sessionBResult = await convexMutation('adminSessions:createSession', {
    class_id: classId,
    location: 'TC-017 Session B',
    date: getFutureDate(7),
    time: '10:00',
    quota_defined: 10,
    admin_username: 'admin',
  }) as { session_id: string };
  const sessionBId = sessionBResult.session_id;
  expect(sessionBId).toBeTruthy();

  const sessionCResult = await convexMutation('adminSessions:createSession', {
    class_id: classId,
    location: 'TC-017 Session C',
    date: getFutureDate(9),
    time: '11:00',
    quota_defined: 10,
    admin_username: 'admin',
  }) as { session_id: string };
  const sessionCId = sessionCResult.session_id;
  expect(sessionCId).toBeTruthy();

  // Step 3: Create test purchase and enroll in Session A
  const purchaseResult = await convexMutation('testPurchase:createTestPurchase', {
    customer_mobile: '+6599017017',
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
  const afterEnroll = await convexQuery('participants:getParticipantPageData', {
    participant_id: participantId,
  }) as { session_id: string } | null;
  expect(afterEnroll!.session_id).toBe(sessionAId);

  // Step 5: Reschedule A → B
  await rescheduleParticipant(page, participantId, sessionBId);

  const afterReschedule1 = await convexQuery('participants:getParticipantPageData', {
    participant_id: participantId,
  }) as { session_id: string } | null;
  expect(afterReschedule1!.session_id, 'After first reschedule, session_id should be B').toBe(sessionBId);

  // Step 6: Reschedule B → C
  await rescheduleParticipant(page, participantId, sessionCId);

  const afterReschedule2 = await convexQuery('participants:getParticipantPageData', {
    participant_id: participantId,
  }) as { session_id: string } | null;
  expect(afterReschedule2!.session_id, 'After second reschedule, session_id should be C').toBe(sessionCId);

  const evidence = {
    participant_id: participantId,
    session_A_id: sessionAId,
    session_B_id: sessionBId,
    session_C_id: sessionCId,
    initial_session: sessionAId,
    after_first_reschedule: afterReschedule1!.session_id,
    final_session_id: afterReschedule2!.session_id,
    final_session_equals_C: afterReschedule2!.session_id === sessionCId,
  };
  console.log('TC-017 Evidence:', JSON.stringify(evidence, null, 2));

  await page.screenshot({ path: 'e2e/tc017-screenshot.png', fullPage: true });
});
