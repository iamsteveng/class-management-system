import { test, expect } from '@playwright/test';

// TC-048: Terms form mobile input is pre-filled with "+852" and shows country code hint
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

test('TC-048: Terms form mobile input is pre-filled with "+852" and label hints at country code', async ({ page }) => {
  // Step 1: Create a test purchase to get a valid terms token
  const purchase = await convexMutation('testPurchase:createTestPurchase', {
    customer_mobile: '+85200000048',
  }) as { token: string };

  // Step 2: Navigate to the terms page
  await page.goto(`${BASE_URL}/terms?token=${purchase.token}`);
  await page.waitForLoadState('networkidle', { timeout: 20_000 });

  // Step 3: Assert mobile input is pre-filled with "+852"
  const mobileInput = page.locator('input#participant_mobile');
  await expect(mobileInput).toBeVisible({ timeout: 10_000 });
  await expect(mobileInput).toHaveValue('+852');

  // Step 4: Assert placeholder shows "+852XXXXXXXX" format
  await expect(mobileInput).toHaveAttribute('placeholder', '+852XXXXXXXX');

  // Step 5: Assert label includes country code hint (ZH or EN)
  const mobileLabel = page.locator('label[for="participant_mobile"]');
  await expect(mobileLabel).toBeVisible();
  const labelText = await mobileLabel.textContent() ?? '';
  const hasCountryCodeHint = labelText.includes('country code') || labelText.includes('含國碼');
  expect(hasCountryCodeHint).toBe(true);

  await page.screenshot({ path: 'tc048-evidence.png', fullPage: false });

  console.log('TC-048 evidence:', JSON.stringify({
    token: purchase.token,
    mobile_prefilled_value: '+852',
    placeholder: '+852XXXXXXXX',
    label_has_country_code_hint: hasCountryCodeHint,
    label_text: labelText,
  }, null, 2));
});
