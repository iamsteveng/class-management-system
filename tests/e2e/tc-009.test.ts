import { test, expect } from '@playwright/test';
import path from 'path';

const CONVEX_URL = 'https://graceful-mole-393.convex.cloud';
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

test.describe('TC-009: Participant detail does NOT show Name field', () => {
  test('TC-009 participant detail page has no Name field in Personal Information section', async ({ page }) => {
    const testId = Date.now();
    const screenshotDir = path.join(process.cwd(), 'test-results');

    // Step 1: Create a class
    const createdClass = await convexMutation('adminClasses:createClass', {
      name: `TC009 Class ${testId}`,
      description: 'TC-009 participant detail no name field test',
      admin_username: 'admin',
    }) as { class_id: string };

    // Step 2: Create a session
    const createdSession = await convexMutation('adminSessions:createSession', {
      class_id: createdClass.class_id,
      location: `TC009 Studio ${testId}`,
      date: '2030-12-23',
      time: '11:00',
      quota_defined: 10,
      admin_username: 'admin',
    }) as { session_id: string };

    // Step 3: Create a test purchase and accept terms to create a participant
    const purchase = await convexMutation('testPurchase:createTestPurchase', {
      customer_mobile: '+6598009009',
      participant_count: 1,
    }) as { token: string; purchase_id: string };

    const acceptResult = await convexMutation('terms:acceptTermsByToken', {
      token: purchase.token,
      session_id: createdSession.session_id,
      accepted: true,
    }) as { success: boolean; error_message?: string };

    if (!acceptResult.success) {
      throw new Error(`acceptTermsByToken failed: ${acceptResult.error_message}`);
    }

    // Step 4: Get participant_id
    const participants = await convexQuery('testPurchase:getParticipantsByToken', {
      token: purchase.token,
    }) as Array<{ participant_id: string }>;

    expect(participants.length).toBeGreaterThan(0);
    const participantId = participants[0].participant_id;

    // Step 5: Log in as admin
    await page.goto(`${BASE_URL}/admin/login`);
    await page.getByLabel('Username').fill('admin');
    await page.getByLabel('Password').fill('admin123');
    await page.getByRole('button', { name: 'Sign In' }).click();
    await page.waitForURL(/\/admin\/dashboard/, { timeout: 20_000 });

    // Step 6: Navigate to participant detail page
    await page.goto(`${BASE_URL}/admin/participants/${participantId}`);
    await page.waitForLoadState('networkidle');

    // Step 7: Assert page heading is visible
    const heading = page.getByRole('heading', { name: 'Participant Details' });
    await expect(heading).toBeVisible({ timeout: 15_000 });

    // Step 8: Assert "Personal Information" section does NOT contain a "Name" dt
    const personalInfoSection = page.locator('section').filter({ hasText: 'Personal Information' });
    await expect(personalInfoSection).toBeVisible({ timeout: 10_000 });

    // Get all dt labels within the Personal Information section
    const personalInfoDts = personalInfoSection.locator('dt');
    const personalInfoLabels = await personalInfoDts.allTextContents();
    console.log('TC-009 Personal Information labels:', personalInfoLabels);

    const hasNameInPersonalInfo = personalInfoLabels.some(
      (label) => label.trim().toLowerCase() === 'name'
    );
    expect(
      hasNameInPersonalInfo,
      `Expected no "Name" label in Personal Information section but found one. Labels: ${JSON.stringify(personalInfoLabels)}`
    ).toBe(false);

    // Step 9: Assert expected fields ARE present in Personal Information
    const expectedPersonalFields = ['Mobile'];
    for (const field of expectedPersonalFields) {
      const hasField = personalInfoLabels.some((l) => l.trim() === field);
      expect(hasField, `Expected "${field}" in Personal Information section`).toBe(true);
    }

    // Step 10: Assert Emergency Contact section is present (has its own "Name" for emergency contact)
    const emergencySection = page.locator('section').filter({ hasText: 'Emergency Contact' });
    await expect(emergencySection).toBeVisible({ timeout: 10_000 });

    // Step 11: Assert Session section fields are present
    const sessionSection = page.locator('section').filter({ hasText: 'Class' }).filter({ hasText: 'Location' });
    await expect(sessionSection).toBeVisible({ timeout: 10_000 });

    const sessionDts = sessionSection.locator('dt');
    const sessionLabels = await sessionDts.allTextContents();
    console.log('TC-009 Session labels:', sessionLabels);

    const expectedSessionFields = ['Class', 'Location', 'Date & Time', 'Terms Accepted'];
    for (const field of expectedSessionFields) {
      const hasField = sessionLabels.some((l) => l.trim() === field);
      expect(hasField, `Expected "${field}" in Session section`).toBe(true);
    }

    // Step 12: Take screenshot as evidence
    await page.screenshot({
      path: path.join(screenshotDir, 'tc-009-participant-detail-no-name-field.png'),
      fullPage: true,
    });

    console.log('TC-009 evidence:', JSON.stringify({
      participant_id: participantId,
      personal_info_labels: personalInfoLabels,
      name_field_absent_in_personal_info: !hasNameInPersonalInfo,
      session_labels: sessionLabels,
    }, null, 2));
  });
});
