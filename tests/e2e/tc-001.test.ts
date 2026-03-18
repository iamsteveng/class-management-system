import { test, expect } from '@playwright/test';
import path from 'path';

const CONVEX_URL = 'https://colorless-raven-523.convex.cloud';
const BASE_URL = 'https://class-management-system-teal.vercel.app';

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

test.describe('TC-001: Terms form — submit with all extra fields populated', () => {
  test('TC-001 submits terms form with height, age, emergency contact fields and verifies Convex record', async ({ page }) => {
    // Step 1: Create a test purchase
    const result = await convexMutation('testPurchase:createTestPurchase', {
      customer_mobile: '+6599001001',
      participant_count: 1,
    }) as { token: string; purchase_id: string };
    const token = result.token;

    // Step 2: Navigate to terms page
    await page.goto(`${BASE_URL}/terms?token=${token}`);

    // Step 3: Wait for the form to load and select a session
    const sessionSelect = page.locator('select[name="session_id"]');
    await expect(sessionSelect).toBeVisible({ timeout: 15000 });

    // Select the first available session option (not the empty default)
    const options = await sessionSelect.locator('option').all();
    expect(options.length, 'Should have at least one session option beyond the placeholder').toBeGreaterThan(1);

    // Select the first real session option
    const firstSessionValue = await options[1].getAttribute('value');
    expect(firstSessionValue, 'First session option must have a value').toBeTruthy();
    await sessionSelect.selectOption(firstSessionValue!);

    // Step 4: Fill in extra fields
    await page.fill('input[name="height"]', '170cm');
    await page.fill('input[name="age"]', '28');
    await page.fill('input[name="emergency_contact_name"]', 'Jane Doe');
    await page.fill('input[name="emergency_contact_phone"]', '+6591234567');

    // Step 5: Accept the terms checkbox
    await page.check('input[name="accepted"]');

    // Step 6: Submit the form
    const submitBtn = page.locator('button[type="submit"]');
    await expect(submitBtn).toBeEnabled({ timeout: 5000 });
    await submitBtn.click();

    // Step 7: Wait for success state
    await expect(page).toHaveURL(/status=success/, { timeout: 20000 });
    await expect(page.getByText('Terms accepted successfully.')).toBeVisible({ timeout: 10000 });

    // Step 8: Take screenshot of success state
    const screenshotDir = path.join(process.cwd(), 'test-results');
    await page.screenshot({ path: path.join(screenshotDir, 'tc-001-success.png'), fullPage: true });

    // Step 9: Query Convex for participant record with extra fields
    const participants = await convexQuery('testPurchase:getParticipantsFullByToken', { token }) as Array<{
      participant_id: string;
      session_id: string;
      terms_accepted_at?: number;
      height?: string;
      age?: number;
      emergency_contact_name?: string;
      emergency_contact_phone?: string;
    }>;

    expect(participants.length, `Expected 1 participant, got ${participants.length}`).toBe(1);

    const participant = participants[0];

    // Assert extra fields are stored in Convex
    expect(participant.height, 'height must be stored in Convex').toBe('170cm');
    expect(participant.age, 'age must be stored in Convex').toBe(28);
    expect(participant.emergency_contact_name, 'emergency_contact_name must be stored in Convex').toBe('Jane Doe');
    expect(participant.emergency_contact_phone, 'emergency_contact_phone must be stored in Convex').toBe('+6591234567');

    // Evidence output
    console.log('Convex record evidence:', JSON.stringify({
      participant_id: participant.participant_id,
      height: participant.height,
      age: participant.age,
      emergency_contact_name: participant.emergency_contact_name,
      emergency_contact_phone: participant.emergency_contact_phone,
      terms_accepted_at: participant.terms_accepted_at,
    }, null, 2));
  });
});
