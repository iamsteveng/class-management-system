import { test, expect } from '@playwright/test';

// TC-050: Terms form stores participant mobile in E.164 format in DB after valid submission
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

test('TC-050: Valid E.164 mobile submitted in terms form is stored in E.164 format in DB', async ({ page }) => {
  const testId = Date.now();

  // Step 1: Create class + session so the terms form has a selectable option
  const cls = await convexMutation('adminClasses:createClass', {
    name_zh: `TC050 Class ${testId}`,
    admin_username: 'admin',
    payment_url: `https://example.com/tc050-${testId}`,
  }) as { class_id: string };
  const session = await convexMutation('adminSessions:createSession', {
    class_id: cls.class_id,
    location_zh: `TC050-Location-${testId}`,
    date: '2030-10-01',
    time: '09:00',
    quota_defined: 10,
    admin_username: 'admin',
  }) as { session_id: string };
  const sessionId = session.session_id;

  // Step 2: Create test purchase linked to the class so sessions appear in the form
  const purchase = await convexMutation('testPurchase:createTestPurchase', {
    customer_mobile: '+85200000050',
    participant_count: 1,
    class_id: cls.class_id,
  }) as { token: string };

  // Step 3: Navigate to terms page
  await page.goto(`${BASE_URL}/terms?token=${purchase.token}`);
  await page.waitForLoadState('networkidle', { timeout: 20_000 });

  // Step 4: Select session
  await page.locator('select#session_id').selectOption(sessionId);

  // Step 5: Fill all fields with a valid E.164 mobile "+85254304789"
  const testMobile = '+85254304789';
  await page.locator('input#name').fill('TC050 Test');
  await page.locator('input#participant_mobile').fill(testMobile);
  await page.locator('input#email').fill('tc050@test.com');

  if (await page.locator('input#height').isVisible()) {
    await page.locator('input#height').fill('170');
  }
  if (await page.locator('input#age').isVisible()) {
    await page.locator('input#age').fill('30');
  }
  if (await page.locator('input#emergency_contact_name').isVisible()) {
    await page.locator('input#emergency_contact_name').fill('TC050 Emergency');
  }
  if (await page.locator('input#emergency_contact_phone').isVisible()) {
    await page.locator('input#emergency_contact_phone').fill('+85298765000');
  }

  await page.locator('input[name="accepted"]').check();

  // Step 6: Submit
  const submitButton = page.getByRole('button', { name: /Accept Terms|接受條款/ });
  await expect(submitButton).toBeEnabled({ timeout: 5_000 });
  await submitButton.click();

  // Step 7: Wait for success redirect and extract participant_id
  await page.waitForURL(/status=success/, { timeout: 20_000 });
  const successUrl = new URL(page.url());
  const participantId = successUrl.searchParams.get('participant_id');
  expect(participantId).toBeTruthy();

  await page.screenshot({ path: 'tc050-success.png', fullPage: false });

  // Step 8: Query DB to verify participant.mobile is stored in E.164 format
  const participantData = await convexQuery('participants:getParticipantMobileById', {
    participant_id: participantId as string,
  }) as { mobile: string | null } | null;

  expect(participantData).not.toBeNull();
  expect(participantData?.mobile).toBe(testMobile);

  // Step 9: Confirm no normalization mutation happened — mobile was already E.164
  expect(participantData?.mobile?.startsWith('+')).toBe(true);

  await page.screenshot({ path: 'tc050-evidence.png', fullPage: false });

  console.log('TC-050 evidence:', JSON.stringify({
    token: purchase.token,
    participant_id: participantId,
    submitted_mobile: testMobile,
    stored_mobile: participantData?.mobile,
    is_e164: participantData?.mobile?.startsWith('+'),
  }, null, 2));
});
