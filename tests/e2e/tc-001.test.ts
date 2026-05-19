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

test.describe('TC-001: Homepage only shows classes with payment URL', () => {
  test('TC-001 homepage displays classes with payment_url and hides classes without payment_url', async ({ page }) => {
    const testId = Date.now();
    const classAName = `TC001 With Payment ${testId}`;
    const classBName = `TC001 No Payment ${testId}`;

    // Step 1: Seed — Class A (active, has payment_url)
    const classA = await convexMutation('adminClasses:createClass', {
      name_zh: classAName,
      description: 'TC-001 test class with payment URL',
      payment_url: 'https://example.com/pay-tc001',
      admin_username: 'admin',
    }) as { class_id: string };

    // Step 2: Seed — Class B (active, NO payment_url)
    const classB = await convexMutation('adminClasses:createClass', {
      name_zh: classBName,
      description: 'TC-001 test class without payment URL',
      admin_username: 'admin',
    }) as { class_id: string };

    try {
      // Step 3: Navigate to homepage
      await page.goto(BASE_URL);

      // Step 4: Wait for class listing to load (loading spinner disappears)
      await expect(page.getByText('Loading classes...')).toBeHidden({ timeout: 15000 });

      // Step 5: Class A (with payment_url) MUST be visible
      const classACard = page.getByRole('heading', { name: classAName });
      await expect(classACard).toBeVisible({ timeout: 10000 });

      // Step 6: Class B (no payment_url) MUST NOT be visible
      const classBCard = page.getByRole('heading', { name: classBName });
      await expect(classBCard).not.toBeVisible({ timeout: 5000 });

      // Step 7: Screenshot evidence
      const screenshotDir = path.join(process.cwd(), 'test-results');
      await page.screenshot({ path: path.join(screenshotDir, 'tc-001-homepage-class-listing.png'), fullPage: true });

      console.log('TC-001 evidence:', JSON.stringify({
        classA_id: classA.class_id,
        classA_name: classAName,
        classB_id: classB.class_id,
        classB_name: classBName,
        classA_visible: true,
        classB_visible: false,
      }, null, 2));
    } finally {
      // Cleanup: cancel both test classes
      await convexMutation('adminClasses:cancelClass', {
        class_id: classA.class_id,
        admin_username: 'admin',
      }).catch(() => { /* ignore cleanup errors */ });
      await convexMutation('adminClasses:cancelClass', {
        class_id: classB.class_id,
        admin_username: 'admin',
      }).catch(() => { /* ignore cleanup errors */ });
    }
  });
});
