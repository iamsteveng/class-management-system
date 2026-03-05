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

async function convexQuery(path: string, args: Record<string, unknown>) {
  const res = await fetch(`${CONVEX_URL}/api/query`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ path, args, format: 'json' }),
  });
  const json = await res.json() as { status: string; value?: unknown; errorMessage?: string };
  if (json.status !== 'success') throw new Error(`Query ${path} failed: ${json.errorMessage}`);
  return json.value;
}

test('TC-009: Terms acceptance saves session and timestamp', async ({ page }) => {
  // Step 1: Create a test purchase
  const result = await convexMutation('testPurchase:createTestPurchase', {
    customer_mobile: '+6599009009',
  }) as { token: string; purchase_id: string };
  const token = result.token;

  // Step 2: Load terms page
  await page.goto(`/terms?token=${token}`);
  await page.waitForLoadState('networkidle');

  // Step 3: Select first available session (S1)
  const select = page.locator('select#session_id');
  await expect(select).toBeVisible();
  const options = await select.locator('option').all();
  const availableOptions = await Promise.all(
    options.map(async (opt) => ({ value: await opt.getAttribute('value'), text: await opt.textContent() }))
  );
  const sessionOption = availableOptions.find(o => o.value && o.value.length > 0);
  expect(sessionOption, 'At least one session must be available').toBeTruthy();
  const selectedSessionId = sessionOption!.value!;
  await select.selectOption(selectedSessionId);

  // Step 4: Check terms checkbox
  const checkbox = page.locator('input[name="accepted"]');
  await checkbox.check();
  await expect(checkbox).toBeChecked();

  // Step 5: Submit form
  const submitButton = page.locator('button[type="submit"]');
  await expect(submitButton).toBeEnabled();
  await submitButton.click();
  // Wait for server action to complete (success message appears on page)
  await expect(page.locator('text=Terms accepted successfully.')).toBeVisible({ timeout: 15000 });

  // Step 6: Query database to verify
  const purchase = await convexQuery('testPurchase:getPurchaseByToken', { token }) as {
    order_id: string;
    status: string;
    session_id?: string;
  } | null;

  expect(purchase, 'Purchase record must exist').not.toBeNull();
  expect(purchase!.status, `Expected status='terms_accepted', got '${purchase!.status}'`).toBe('terms_accepted');
  expect(purchase!.session_id, 'session_id must be recorded on purchase').toBe(selectedSessionId);

  // Verify timestamp recorded in participants
  const participants = await convexQuery('testPurchase:getParticipantsByToken', { token }) as Array<{
    session_id: string;
    terms_accepted_at?: number;
  }>;

  expect(participants.length, 'Participants must be created').toBeGreaterThan(0);
  for (const p of participants) {
    expect(p.session_id, 'Participant session_id must match selected session').toBe(selectedSessionId);
    expect(p.terms_accepted_at, 'terms_accepted_at timestamp must be recorded').toBeTruthy();
  }

  // Evidence output
  console.log('DB Evidence:', JSON.stringify({
    purchase: {
      status: purchase!.status,
      session_id: purchase!.session_id,
    },
    participants: participants.map(p => ({
      session_id: p.session_id,
      terms_accepted_at: p.terms_accepted_at,
      terms_accepted_at_iso: p.terms_accepted_at ? new Date(p.terms_accepted_at).toISOString() : null,
    })),
  }, null, 2));

  await page.screenshot({ path: 'e2e/tc009-screenshot.png', fullPage: true });
});
