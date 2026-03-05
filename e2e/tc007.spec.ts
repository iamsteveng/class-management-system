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

test('TC-007: Terms page shows only available sessions', async ({ page }) => {
  // Step 1: Create a session with quota_defined=2
  const uniqueSuffix = Date.now();
  const sessionResult = await convexMutation('adminSessions:createSession', {
    class_id: 'class_cycling_fundamentals',
    location: `TC007-Studio-${uniqueSuffix}`,
    date: '2027-06-15',
    time: '10:00',
    quota_defined: 2,
    admin_username: 'admin',
  }) as { session_id: string };
  const fullSessionId = sessionResult.session_id;

  // Step 2: Create a filler purchase (participant_count=2) and accept terms to fill the session
  const fillerResult = await convexMutation('testPurchase:createTestPurchase', {
    customer_mobile: '+6599000001',
  }) as { token: string };
  const fillerToken = fillerResult.token;

  const acceptResult = await convexMutation('terms:acceptTermsByToken', {
    token: fillerToken,
    session_id: fullSessionId,
    accepted: true,
  }) as { success: boolean; error_message?: string };
  expect(acceptResult.success, `Filler acceptance failed: ${acceptResult.error_message}`).toBe(true);

  // Step 3: Create the test purchase
  const testResult = await convexMutation('testPurchase:createTestPurchase', {
    customer_mobile: '+6599000002',
  }) as { token: string };
  const testToken = testResult.token;

  // Step 4: Load the terms page
  await page.goto(`/terms?token=${testToken}`);
  await page.waitForLoadState('networkidle');

  // Step 5: Inspect the session dropdown
  const select = page.locator('select#session_id');
  await expect(select).toBeVisible();

  const options = await select.locator('option').all();
  const optionValues = await Promise.all(options.map(opt => opt.getAttribute('value')));
  const optionTexts = await Promise.all(options.map(opt => opt.textContent()));

  // The full session must NOT appear in the dropdown
  expect(
    optionValues,
    `Full session ${fullSessionId} should be excluded from dropdown. Options: ${optionValues.join(', ')}`
  ).not.toContain(fullSessionId);

  // At least one other session with available quota must be present
  const availableOptions = optionValues.filter(v => v && v.length > 0);
  expect(
    availableOptions.length,
    `Dropdown must show at least one available session. Texts: ${optionTexts.join(', ')}`
  ).toBeGreaterThan(0);

  // Capture evidence screenshot
  await page.screenshot({ path: 'e2e/tc007-screenshot.png', fullPage: true });
});
