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

test('TC-016: Participant can reschedule session', async ({ page }) => {
  // Step 1: Get an existing class_id
  const classListData = await convexQuery('adminClasses:getClassListPageData', {}) as Array<{
    class_id: string;
    name: string;
  }>;
  expect(classListData.length, 'At least one class must exist').toBeGreaterThan(0);
  const classId = classListData[0].class_id;

  // Step 2: Create original session (5 days away, >2 days)
  const originalDate = getFutureDate(5);
  const originalSessionResult = await convexMutation('adminSessions:createSession', {
    class_id: classId,
    location: 'TC-016 Original Location',
    date: originalDate,
    time: '10:00',
    quota_defined: 10,
    admin_username: 'admin',
  }) as { session_id: string };
  const originalSessionId = originalSessionResult.session_id;
  expect(originalSessionId).toBeTruthy();

  // Step 3: Create target session (7 days away)
  const targetDate = getFutureDate(7);
  const targetSessionResult = await convexMutation('adminSessions:createSession', {
    class_id: classId,
    location: 'TC-016 Target Location',
    date: targetDate,
    time: '14:00',
    quota_defined: 10,
    admin_username: 'admin',
  }) as { session_id: string };
  const targetSessionId = targetSessionResult.session_id;
  expect(targetSessionId).toBeTruthy();

  // Step 4: Create test purchase and enroll in original session
  const purchaseResult = await convexMutation('testPurchase:createTestPurchase', {
    customer_mobile: '+6599016016',
  }) as { token: string; purchase_id: string };
  const token = purchaseResult.token;

  const acceptResult = await convexMutation('terms:acceptTermsByToken', {
    token,
    session_id: originalSessionId,
    accepted: true,
  }) as { success: boolean; error_message?: string };
  expect(acceptResult.success, `acceptTermsByToken failed: ${acceptResult.error_message}`).toBe(true);

  // Step 5: Get participant ID
  const participants = await convexQuery('testPurchase:getParticipantsByToken', { token }) as Array<{
    participant_id: string;
    session_id: string;
  }>;
  expect(participants.length).toBeGreaterThan(0);
  const participantId = participants[0].participant_id;

  // Step 6: Record quota AFTER enrollment (before reschedule)
  const sessionDataBefore = await convexQuery('adminSessions:getSessionManagementPageData', { class_id: classId }) as {
    sessions: Array<{ session_id: string; quota_used: number }>;
  };
  const origBefore = sessionDataBefore.sessions.find((s) => s.session_id === originalSessionId)!;
  const targBefore = sessionDataBefore.sessions.find((s) => s.session_id === targetSessionId)!;
  expect(origBefore).toBeTruthy();
  expect(targBefore).toBeTruthy();

  // Step 7: Load participant page (>2 days away)
  await page.goto(`/participant/${encodeURIComponent(participantId)}`);
  await page.waitForLoadState('networkidle');

  // Step 8: Click "Change Session" button
  const changeSessionButton = page.getByRole('button', { name: 'Change Session' });
  await expect(changeSessionButton).toBeVisible();
  await changeSessionButton.click();

  // Step 9: Select the target session from dropdown
  const sessionSelect = page.locator('#new_session_id');
  await expect(sessionSelect).toBeVisible();
  await sessionSelect.selectOption({ value: targetSessionId });

  // Step 10: Click "Save" to submit, then wait for the redirect confirming the server action completed
  const saveButton = page.getByRole('button', { name: 'Save' });
  await expect(saveButton).toBeEnabled();
  await saveButton.click();
  await page.waitForURL(/status=session_changed/, { timeout: 15000 });
  await page.waitForLoadState('networkidle');

  // Step 11: Database verification via Convex API
  const participantAfter = await convexQuery('participants:getParticipantPageData', {
    participant_id: participantId,
  }) as { session_id: string } | null;

  const sessionDataAfter = await convexQuery('adminSessions:getSessionManagementPageData', { class_id: classId }) as {
    sessions: Array<{ session_id: string; quota_used: number }>;
  };
  const origAfter = sessionDataAfter.sessions.find((s) => s.session_id === originalSessionId)!;
  const targAfter = sessionDataAfter.sessions.find((s) => s.session_id === targetSessionId)!;

  expect(participantAfter, 'Participant should still exist').not.toBeNull();
  expect(participantAfter!.session_id, 'participant.session_id must be updated to target session').toBe(targetSessionId);
  expect(origAfter.quota_used, 'Old session quota_used must decrease by 1').toBe(origBefore.quota_used - 1);
  expect(targAfter.quota_used, 'New session quota_used must increase by 1').toBe(targBefore.quota_used + 1);

  const evidence = {
    participant_id: participantId,
    original_session_id: originalSessionId,
    target_session_id: targetSessionId,
    participant_session_id_after: participantAfter!.session_id,
    original_quota_used_before: origBefore.quota_used,
    original_quota_used_after: origAfter.quota_used,
    target_quota_used_before: targBefore.quota_used,
    target_quota_used_after: targAfter.quota_used,
  };
  console.log('TC-016 Evidence:', JSON.stringify(evidence, null, 2));

  await page.screenshot({ path: 'e2e/tc016-screenshot.png', fullPage: true });
});
