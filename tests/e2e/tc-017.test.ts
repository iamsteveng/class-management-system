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

test.describe('TC-017: Admin terms — new participant sees latest terms version', () => {
  test('TC-017 terms acceptance form displays the latest created terms version content', async ({ page }) => {
    const testId = Date.now();
    const newVersion = `tc017-v${testId}`;
    const newContent = `TC-017 test terms content created at ${testId}. All participants must read this carefully.`;

    const screenshotDir = path.join(process.cwd(), 'test-results');

    // Step 1: Log in as admin and create a new terms version
    await page.goto(`${BASE_URL}/admin/login`);
    await page.getByLabel('Username').fill('admin');
    await page.getByLabel('Password').fill('admin123');
    await page.getByRole('button', { name: 'Sign In' }).click();
    await page.waitForURL(/\/admin\/dashboard/, { timeout: 20_000 });

    // Step 2: Navigate to /admin/terms and create a new version
    await page.goto(`${BASE_URL}/admin/terms`);
    await page.waitForLoadState('networkidle', { timeout: 15_000 });
    await expect(page.getByRole('heading', { name: 'Create New Terms Version' })).toBeVisible({ timeout: 10_000 });

    await page.getByLabel('Version').fill(newVersion);
    await page.getByLabel('Terms Content').fill(newContent);
    await page.getByRole('button', { name: 'Create & Activate' }).click();
    await page.waitForURL(/\/admin\/terms.*success=/, { timeout: 20_000 });
    await expect(
      page.getByText(`Terms version "${newVersion}" created and set as current.`)
    ).toBeVisible({ timeout: 10_000 });

    console.log(`TC-017 created new terms version: ${newVersion}`);

    // Step 3: Create a new test purchase via Convex mutation
    const purchase = await convexMutation('testPurchase:createTestPurchase', {
      customer_mobile: `+6017${testId.toString().slice(-7)}`,
      participant_count: 1,
    }) as { purchase_id: string; token: string };

    console.log(`TC-017 created test purchase token: ${purchase.token}`);

    // Step 4: Navigate to the terms acceptance page for this new purchase token
    await page.goto(`${BASE_URL}/terms?token=${purchase.token}`);
    await page.waitForLoadState('networkidle', { timeout: 20_000 });

    // Screenshot of the terms form showing the content
    await page.screenshot({ path: path.join(screenshotDir, 'tc-017-terms-form.png'), fullPage: true });

    // Step 5: Assert that the terms section heading shows the new version
    const termsHeading = page.getByRole('heading', { name: new RegExp(`Terms.*${newVersion}`) });
    await expect(termsHeading).toBeVisible({ timeout: 10_000 });

    // Step 6: Assert that the terms content on the form matches the newly created version text
    const termsContentElement = page.locator('p.whitespace-pre-line');
    await expect(termsContentElement).toBeVisible({ timeout: 10_000 });
    const displayedContent = await termsContentElement.textContent();

    console.log('TC-017 displayed terms content:', displayedContent);
    expect(displayedContent?.trim()).toBe(newContent);

    // Final screenshot as evidence
    await page.screenshot({ path: path.join(screenshotDir, 'tc-017-terms-content-verified.png'), fullPage: true });

    console.log('TC-017 evidence:', JSON.stringify({
      new_version: newVersion,
      expected_content: newContent,
      displayed_content: displayedContent?.trim(),
      content_matches: displayedContent?.trim() === newContent,
    }, null, 2));
  });
});
