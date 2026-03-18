import { test, expect } from '@playwright/test';
import path from 'path';

const CONVEX_URL = 'https://colorless-raven-523.convex.cloud';
const BASE_URL = 'https://class-management-system-teal.vercel.app';

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

test.describe('TC-002: Terms form — submit with missing required extra field (height omitted)', () => {
  test('TC-002 submit button is disabled and form does not submit when height is blank', async ({ page }) => {
    // Step 1: Create a test purchase
    const result = await convexMutation('testPurchase:createTestPurchase', {
      customer_mobile: '+6599001002',
      participant_count: 1,
    }) as { token: string; purchase_id: string };
    const token = result.token;

    // Step 2: Navigate to terms page
    await page.goto(`${BASE_URL}/terms?token=${token}`);

    // Step 3: Wait for the form to load and select a session
    const sessionSelect = page.locator('select[name="session_id"]');
    await expect(sessionSelect).toBeVisible({ timeout: 15000 });

    const options = await sessionSelect.locator('option').all();
    expect(options.length, 'Should have at least one session option beyond the placeholder').toBeGreaterThan(1);

    const firstSessionValue = await options[1].getAttribute('value');
    expect(firstSessionValue, 'First session option must have a value').toBeTruthy();
    await sessionSelect.selectOption(firstSessionValue!);

    // Step 4: Fill all fields EXCEPT height
    // height is intentionally left blank
    await page.fill('input[name="age"]', '28');
    await page.fill('input[name="emergency_contact_name"]', 'Jane Doe');
    await page.fill('input[name="emergency_contact_phone"]', '+6591234567');

    // Step 5: Accept the terms checkbox
    await page.check('input[name="accepted"]');

    // Step 6: Verify height field is empty
    const heightValue = await page.inputValue('input[name="height"]');
    expect(heightValue, 'Height field should be empty').toBe('');

    // Step 7: Verify submit button is disabled (canSubmit = false when height is blank)
    const submitBtn = page.locator('button[type="submit"]');
    await expect(submitBtn).toBeDisabled();

    // Step 8: Take screenshot showing disabled submit button (validation error state)
    const screenshotDir = path.join(process.cwd(), 'test-results');
    await page.screenshot({ path: path.join(screenshotDir, 'tc-002-height-missing.png'), fullPage: true });

    // Step 9: Confirm URL has NOT changed to success state
    expect(page.url()).not.toContain('status=success');

    // Step 10: Try clicking the disabled button and confirm still no submission
    await submitBtn.click({ force: true });
    await page.waitForTimeout(1000);
    expect(page.url()).not.toContain('status=success');

    console.log('TC-002 evidence:', JSON.stringify({
      height_value: heightValue,
      submit_button_disabled: true,
      url_unchanged: !page.url().includes('status=success'),
    }, null, 2));
  });
});
