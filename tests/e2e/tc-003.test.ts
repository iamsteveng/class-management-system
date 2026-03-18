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

test.describe('TC-003: Terms form — submit with all extra fields missing', () => {
  test('TC-003 submit is blocked and all four extra fields show required validation when left blank', async ({ page }) => {
    // Step 1: Create a test purchase
    const result = await convexMutation('testPurchase:createTestPurchase', {
      customer_mobile: '+6599001003',
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

    // Step 4: Accept the terms checkbox but leave all four extra fields blank
    // height, age, emergency_contact_name, emergency_contact_phone intentionally left blank
    await page.check('input[name="accepted"]');

    // Step 5: Verify all four extra fields are indeed empty
    const heightValue = await page.inputValue('input[name="height"]');
    const ageValue = await page.inputValue('input[name="age"]');
    const emergencyNameValue = await page.inputValue('input[name="emergency_contact_name"]');
    const emergencyPhoneValue = await page.inputValue('input[name="emergency_contact_phone"]');

    expect(heightValue, 'height should be empty').toBe('');
    expect(ageValue, 'age should be empty').toBe('');
    expect(emergencyNameValue, 'emergency_contact_name should be empty').toBe('');
    expect(emergencyPhoneValue, 'emergency_contact_phone should be empty').toBe('');

    // Step 6: Verify submit button is disabled (canSubmit = false when any extra field is blank)
    const submitBtn = page.locator('button[type="submit"]');
    await expect(submitBtn).toBeDisabled();

    // Step 7: Enable the submit button via JS to trigger HTML5 required-field validation
    // This simulates attempting to submit with empty required fields
    await page.evaluate(() => {
      const btn = document.querySelector('button[type="submit"]') as HTMLButtonElement | null;
      if (btn) btn.disabled = false;
    });

    // Step 8: Click the now-enabled button to trigger HTML5 validation errors on all blank required fields
    await submitBtn.click();

    // Step 9: Take screenshot showing browser validation errors on multiple empty required fields
    const screenshotDir = path.join(process.cwd(), 'test-results');
    await page.screenshot({ path: path.join(screenshotDir, 'tc-003-all-extra-fields-missing.png'), fullPage: true });

    // Step 10: Verify submission is blocked — URL must NOT have status=success
    expect(page.url()).not.toContain('status=success');

    // Step 11: Confirm all four required fields are still showing as invalid via validity API
    const validityResults = await page.evaluate(() => {
      const fields = ['height', 'age', 'emergency_contact_name', 'emergency_contact_phone'];
      return fields.map((name) => {
        const el = document.querySelector(`[name="${name}"]`) as HTMLInputElement | null;
        return {
          name,
          value: el?.value ?? null,
          valid: el?.validity?.valid ?? null,
          valueMissing: el?.validity?.valueMissing ?? null,
        };
      });
    });

    console.log('TC-003 field validity evidence:', JSON.stringify(validityResults, null, 2));

    // All four fields must be invalid due to missing value
    for (const field of validityResults) {
      expect(field.valid, `Field ${field.name} should be invalid`).toBe(false);
      expect(field.valueMissing, `Field ${field.name} should have valueMissing=true`).toBe(true);
    }

    console.log('TC-003 evidence:', JSON.stringify({
      height_empty: heightValue === '',
      age_empty: ageValue === '',
      emergency_name_empty: emergencyNameValue === '',
      emergency_phone_empty: emergencyPhoneValue === '',
      submit_button_initially_disabled: true,
      url_unchanged: !page.url().includes('status=success'),
      all_fields_invalid: validityResults.every(f => f.valueMissing),
    }, null, 2));
  });
});
