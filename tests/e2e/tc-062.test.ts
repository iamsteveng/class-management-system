import { test, expect } from '@playwright/test';
import path from 'path';

// TC-062: Admin edit modal shows Group Price and Min Qty for Group Price fields
// for super_admin.
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

test.describe('TC-062: Admin edit modal shows group pricing fields', () => {
  test('TC-062 airwallex_group_price and airwallex_group_min_qty inputs are visible for super_admin', async ({ page }) => {
    const testId = Date.now();
    const cls = await convexMutation('adminClasses:createClass', {
      name_zh: `TC062 Group Price Class ${testId}`,
      admin_username: 'admin',
    }) as { class_id: string };

    await page.goto(`${BASE_URL}/admin/login`);
    await page.getByLabel('Username').fill('admin');
    await page.getByLabel('Password').fill('admin123');
    await page.getByRole('button', { name: 'Sign In' }).click();
    await page.waitForURL(/\/admin\/dashboard/, { timeout: 20_000 });

    await page.goto(`${BASE_URL}/admin/classes`);
    await page.waitForLoadState('networkidle');

    const classRow = page.locator('tbody tr').filter({ hasText: cls.class_id });
    await expect(classRow).toBeVisible({ timeout: 15_000 });
    await classRow.getByRole('button', { name: 'Edit' }).click();
    await expect(page.getByRole('heading', { name: 'Edit Class' })).toBeVisible({ timeout: 10_000 });

    // Group Price input
    const groupPriceInput = page.locator('input[name="airwallex_group_price"]');
    await expect(groupPriceInput).toBeVisible();
    await expect(groupPriceInput).toHaveAttribute('placeholder', 'e.g. 250');

    // Min Qty input
    const groupMinQtyInput = page.locator('input[name="airwallex_group_min_qty"]');
    await expect(groupMinQtyInput).toBeVisible();
    await expect(groupMinQtyInput).toHaveAttribute('placeholder', 'e.g. 2');

    const screenshotDir = path.join(process.cwd(), 'test-results');
    await page.screenshot({ path: path.join(screenshotDir, 'tc-062-group-price-fields.png'), fullPage: true });

    console.log('TC-062 evidence:', JSON.stringify({
      class_id: cls.class_id,
      group_price_visible: true,
      group_min_qty_visible: true,
    }));

    await convexMutation('adminClasses:cancelClass', { class_id: cls.class_id, admin_username: 'admin' });
  });
});
