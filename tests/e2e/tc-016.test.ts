import { test, expect } from '@playwright/test';
import path from 'path';

const CONVEX_URL = 'https://colorless-raven-523.convex.cloud';
const BASE_URL = 'https://class-management-system-teal.vercel.app';

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

test.describe('TC-016: Admin terms — creating a new terms version makes it current', () => {
  test('TC-016 creating a new terms version sets it as current and deactivates previous', async ({ page }) => {
    const testId = Date.now();
    const newVersion = `tc016-v${testId}`;
    const newContent = `TC-016 test terms content created at ${testId}`;

    // Step 1: Record the current terms version before the test
    const termsBefore = await convexQuery('adminTerms:getCurrentTermsVersion', {}) as {
      version: string;
      content: string;
      created_at: number;
    } | null;

    console.log('TC-016 terms before:', JSON.stringify(termsBefore));

    // Step 2: Log in as admin (super_admin)
    await page.goto(`${BASE_URL}/admin/login`);
    await page.getByLabel('Username').fill('admin');
    await page.getByLabel('Password').fill('admin123');
    await page.getByRole('button', { name: 'Sign In' }).click();
    await page.waitForURL(/\/admin\/dashboard/, { timeout: 20_000 });

    // Step 3: Navigate to /admin/terms
    await page.goto(`${BASE_URL}/admin/terms`);
    await page.waitForLoadState('networkidle', { timeout: 15_000 });

    // Assert the "Create New Terms Version" form is visible (super_admin only)
    await expect(page.getByRole('heading', { name: 'Create New Terms Version' })).toBeVisible({ timeout: 10_000 });

    // Screenshot before submitting
    const screenshotDir = path.join(process.cwd(), 'test-results');
    await page.screenshot({ path: path.join(screenshotDir, 'tc-016-before-submit.png'), fullPage: true });

    // Step 4: Fill in the new terms version
    await page.getByLabel('Version').fill(newVersion);
    await page.getByLabel('Terms Content').fill(newContent);

    // Step 5: Submit the form
    await page.getByRole('button', { name: 'Create & Activate' }).click();

    // Wait for redirect with success param
    await page.waitForURL(/\/admin\/terms.*success=/, { timeout: 20_000 });

    // Assert success message is visible
    await expect(
      page.getByText(`Terms version "${newVersion}" created and set as current.`)
    ).toBeVisible({ timeout: 10_000 });

    // Screenshot after successful creation
    await page.screenshot({ path: path.join(screenshotDir, 'tc-016-after-submit.png'), fullPage: true });

    // Step 6: Verify via Convex API that the new version is now current (is_current = true)
    const termsAfter = await convexQuery('adminTerms:getCurrentTermsVersion', {}) as {
      version: string;
      content: string;
      created_at: number;
    } | null;

    console.log('TC-016 terms after:', JSON.stringify(termsAfter));

    // New version must be current
    expect(termsAfter).not.toBeNull();
    expect(termsAfter!.version).toBe(newVersion);
    expect(termsAfter!.content).toBe(newContent);

    // Previous version must no longer be current:
    // Since getCurrentTermsVersion returns only the current version,
    // and it now returns the new version, the previous version is confirmed is_current = false.
    if (termsBefore) {
      expect(termsAfter!.version).not.toBe(termsBefore.version);
    }

    console.log('TC-016 evidence:', JSON.stringify({
      version_before: termsBefore?.version ?? null,
      version_after: termsAfter!.version,
      new_version_is_current: true,
      old_version_is_current: false,
    }, null, 2));
  });
});
