import { test, expect } from '@playwright/test';
import path from 'path';

// TC-054: Super admin sees airwallex_price and airwallex_currency fields in the class edit modal.
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

test.describe('TC-054: Super admin sees Airwallex fields in class edit modal', () => {
  test('TC-054 airwallex_price and airwallex_currency inputs are visible in class edit form for super_admin', async ({ page }) => {
    const testId = Date.now();

    // Step 1: Create a test class
    const createdClass = await convexMutation('adminClasses:createClass', {
      name_zh: `TC054 Airwallex Fields ${testId}`,
      admin_username: 'admin',
    }) as { class_id: string };

    // Step 2: Login as super_admin
    await page.goto(`${BASE_URL}/admin/login`);
    await page.getByLabel('Username').fill('admin');
    await page.getByLabel('Password').fill('admin123');
    await page.getByRole('button', { name: 'Sign In' }).click();
    await page.waitForURL(/\/admin\/dashboard/, { timeout: 20_000 });

    // Step 3: Navigate to classes page
    await page.goto(`${BASE_URL}/admin/classes`);
    await page.waitForLoadState('networkidle');

    // Step 4: Find the test class row and click Edit
    const classRow = page.locator('tbody tr').filter({ hasText: createdClass.class_id });
    await expect(classRow).toBeVisible({ timeout: 15_000 });
    await classRow.getByRole('button', { name: 'Edit' }).click();

    // Step 5: Wait for the Edit Class modal
    await expect(page.getByRole('heading', { name: 'Edit Class' })).toBeVisible({ timeout: 10_000 });

    // Step 6: Assert Airwallex fields are present
    const priceInput = page.locator('input[name="airwallex_price"]');
    const currencyInput = page.locator('input[name="airwallex_currency"]');
    await expect(priceInput).toBeVisible({ timeout: 5_000 });
    await expect(currencyInput).toBeVisible({ timeout: 5_000 });

    // Verify placeholders
    await expect(priceInput).toHaveAttribute('placeholder', 'e.g. 1200');
    await expect(currencyInput).toHaveAttribute('placeholder', 'e.g. HKD');

    const screenshotDir = path.join(process.cwd(), 'test-results');
    await page.screenshot({ path: path.join(screenshotDir, 'tc-054-airwallex-fields.png'), fullPage: true });

    console.log('TC-054 evidence:', JSON.stringify({
      class_id: createdClass.class_id,
      airwallex_price_visible: true,
      airwallex_currency_visible: true,
    }, null, 2));

    // Cleanup
    await convexMutation('adminClasses:cancelClass', {
      class_id: createdClass.class_id,
      admin_username: 'admin',
    });
  });
});
