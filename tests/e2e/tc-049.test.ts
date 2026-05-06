import { test, expect } from '@playwright/test';

// TC-049: Terms form rejects submission with invalid mobile (too short to normalize)
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

test('TC-049: Terms form rejects invalid mobile with server error message', async ({ page }) => {
  const testId = Date.now();

  // Step 1: Create class + session so the terms form has a selectable option
  const cls = await convexMutation('adminClasses:createClass', {
    name_zh: `TC049 Class ${testId}`,
    admin_username: 'admin',
    payment_url: `https://example.com/tc049-${testId}`,
  }) as { class_id: string };
  const session = await convexMutation('adminSessions:createSession', {
    class_id: cls.class_id,
    location_zh: `TC049-Location-${testId}`,
    date: '2030-09-01',
    time: '09:00',
    quota_defined: 10,
    admin_username: 'admin',
  }) as { session_id: string };
  const sessionId = session.session_id;

  // Step 2: Create test purchase linked to the class so sessions appear in the form
  const purchase = await convexMutation('testPurchase:createTestPurchase', {
    customer_mobile: '+85200000049',
    class_id: cls.class_id,
  }) as { token: string };

  // Step 3: Navigate to terms page
  await page.goto(`${BASE_URL}/terms?token=${purchase.token}`);
  await page.waitForLoadState('networkidle', { timeout: 20_000 });

  // Step 4: Select session
  await page.locator('select#session_id').selectOption(sessionId);

  // Step 5: Fill all fields correctly EXCEPT mobile — enter "123" (too short to normalize)
  await page.locator('input#name').fill('TC049 Test');
  await page.locator('input#participant_mobile').fill('123');
  await page.locator('input#email').fill('tc049@test.com');

  // Fill height/age/emergency if visible (deployed on this branch)
  if (await page.locator('input#height').isVisible()) {
    await page.locator('input#height').fill('170');
  }
  if (await page.locator('input#age').isVisible()) {
    await page.locator('input#age').fill('30');
  }
  if (await page.locator('input#emergency_contact_name').isVisible()) {
    await page.locator('input#emergency_contact_name').fill('TC049 Emergency');
  }
  if (await page.locator('input#emergency_contact_phone').isVisible()) {
    await page.locator('input#emergency_contact_phone').fill('+85298765000');
  }

  // Check the acceptance checkbox
  await page.locator('input[name="accepted"]').check();

  // Step 6: Submit button should be enabled (mobile "123" passes client-side length check)
  const submitButton = page.getByRole('button', { name: /Accept Terms|接受條款/ });
  await expect(submitButton).toBeEnabled({ timeout: 5_000 });

  await page.screenshot({ path: 'tc049-before-submit.png', fullPage: false });

  // Step 7: Click submit
  await submitButton.click();

  // Step 8: Assert error message appears — no redirect to success
  const errorMsg = page.locator('p.text-red-700');
  await expect(errorMsg).toBeVisible({ timeout: 10_000 });
  await expect(errorMsg).toContainText('valid mobile');

  // Step 9: Assert page did NOT redirect to success
  expect(page.url()).not.toContain('status=success');

  await page.screenshot({ path: 'tc049-evidence.png', fullPage: false });

  console.log('TC-049 evidence:', JSON.stringify({
    token: purchase.token,
    invalid_mobile: '123',
    error_message_shown: true,
    redirected_to_success: false,
  }, null, 2));
});
