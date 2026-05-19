import { test, expect } from '@playwright/test';
import path from 'path';

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

test.describe('TC-021: Admin participant detail — shows height, age, emergency contact', () => {
  test('TC-021 participant detail page displays height, age, emergency contact name and phone', async ({ page }) => {
    const testId = Date.now();
    const screenshotDir = path.join(process.cwd(), 'test-results');

    // Step 1: Create a class
    const createdClass = await convexMutation('adminClasses:createClass', {
      name_zh: `TC021 Class ${testId}`,
      description: 'Participant detail extra fields test',
      admin_username: 'admin',
    }) as { class_id: string };

    // Step 2: Create a session with ample quota
    const createdSession = await convexMutation('adminSessions:createSession', {
      class_id: createdClass.class_id,
      location_zh: `TC021 Studio ${testId}`,
      date: '2030-12-25',
      time: '10:00',
      quota_defined: 10,
      admin_username: 'admin',
    }) as { session_id: string };

    // Step 3: Create a test purchase (pending_terms)
    const createdPurchase = await convexMutation('testPurchase:createTestPurchase', {
      customer_mobile: `+601${testId.toString().slice(-8)}`,
      participant_count: 1,
    }) as { purchase_id: string; token: string };

    console.log(`TC-021 setup: class=${createdClass.class_id} session=${createdSession.session_id} token=${createdPurchase.token}`);

    // Step 4: Accept terms with height, age, and emergency contact populated
    const acceptResult = await convexMutation('terms:acceptTermsByToken', {
      token: createdPurchase.token,
      session_id: createdSession.session_id,
      accepted: true,
      name: 'Test Participant',
      participant_mobile: '+60123456789',
      email: 'test@example.com',
      height: 170,
      age: 28,
      emergency_contact_name: 'Jane Doe',
      emergency_contact_phone: '+60123456789',
    }) as { success: boolean; error_message?: string };

    if (!acceptResult.success) {
      throw new Error(`acceptTermsByToken failed: ${acceptResult.error_message}`);
    }

    // Step 5: Retrieve the participant_id from the purchase token
    const participants = await convexQuery('testPurchase:getParticipantsByToken', {
      token: createdPurchase.token,
    }) as Array<{ participant_id: string; session_id: string }>;

    if (participants.length === 0) {
      throw new Error('No participants found after accepting terms');
    }

    const participantId = participants[0].participant_id;
    console.log(`TC-021: participant_id=${participantId}`);

    // Step 6: Log in as admin
    await page.goto(`${BASE_URL}/admin/login`);
    await page.getByLabel('Username').fill('admin');
    await page.getByLabel('Password').fill('admin123');
    await page.getByRole('button', { name: 'Sign In' }).click();
    await page.waitForURL(/\/admin\/dashboard/, { timeout: 20_000 });

    // Step 7: Navigate to participant detail page
    await page.goto(`${BASE_URL}/admin/participants/${participantId}`);
    await page.waitForLoadState('networkidle', { timeout: 20_000 });

    // Screenshot of the detail page
    await page.screenshot({ path: path.join(screenshotDir, 'tc-021-participant-detail.png'), fullPage: true });

    // Step 8: Assert all four extra fields are visible with correct values

    // Height: label "Height" and value "170cm"
    const heightLabel = page.locator('dt').filter({ hasText: 'Height' });
    await expect(heightLabel).toBeVisible({ timeout: 10_000 });
    const heightValue = heightLabel.locator('~ dd');
    await expect(heightValue).toContainText('170');

    // Age: label "Age" and value "28 years"
    const ageLabel = page.locator('dt').filter({ hasText: 'Age' });
    await expect(ageLabel).toBeVisible();
    const ageValue = ageLabel.locator('~ dd');
    await expect(ageValue).toContainText('28');

    // Emergency Contact Name: label "Name" within Emergency Contact section and value "Jane Doe"
    const emergencySection = page.locator('section').filter({ hasText: 'Emergency Contact' });
    await expect(emergencySection).toBeVisible();
    await expect(emergencySection).toContainText('Jane Doe');
    await expect(emergencySection).toContainText('+60123456789');

    console.log('TC-021 evidence: All four extra fields visible on participant detail page');
  });
});
