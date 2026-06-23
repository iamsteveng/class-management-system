import { test, expect } from '@playwright/test';
import path from 'path';

// TC-075: Cancel & Refund button visible for Alipay HK purchases, not for s3 purchases.
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

test.describe('TC-075: Cancel & Refund button visibility by purchase source', () => {
  test('TC-075 Cancel & Refund button shown for airwallex purchase, not for s3 purchase', async ({ page }) => {
    const testId = Date.now();

    // Create test class
    const createdClass = await convexMutation('adminClasses:createClass', {
      name_zh: `TC075 Class ${testId}`,
      admin_username: 'admin',
    }) as { class_id: string };

    // Create airwallex purchase
    await convexMutation('purchases:createPurchase', {
      order_id: `tc075-airwallex-${testId}`,
      customer_mobile: '+85291234567',
      participant_count: 1,
      class_id: createdClass.class_id,
      source: 'airwallex',
      unit_price: 500,
      total_price: 500,
      currency: 'HKD',
      purchase_datetime: new Date().toISOString(),
      slot_index: 0,
    });

    // Create s3 purchase
    await convexMutation('purchases:createPurchase', {
      order_id: `tc075-s3-${testId}`,
      customer_mobile: '+85299999999',
      participant_count: 1,
      class_id: createdClass.class_id,
      source: 's3',
      purchase_datetime: new Date().toISOString(),
      slot_index: 0,
    });

    // Log in as admin
    await page.goto(`${BASE_URL}/admin/login`);
    await page.getByLabel('Username').fill('admin');
    await page.getByLabel('Password').fill('admin123');
    await page.getByRole('button', { name: 'Sign In' }).click();
    await page.waitForURL(/\/admin\/dashboard/, { timeout: 20_000 });

    // Navigate to purchases page
    await page.goto(`${BASE_URL}/admin/purchases`);
    await page.waitForLoadState('networkidle');
    await page.screenshot({
      path: path.join(process.cwd(), 'test-results', 'tc-075-purchases.png'),
      fullPage: true,
    });

    // Find the row with the airwallex order_id — it should show Cancel & Refund
    const airwallexRow = page.locator(`tr:has-text("tc075-airwallex-${testId}")`);
    await expect(airwallexRow).toBeVisible({ timeout: 10_000 });
    const cancelRefundBtn = airwallexRow.getByRole('button', { name: /Cancel & Refund/i });
    await expect(cancelRefundBtn).toBeVisible();

    // Find the s3 row — it should NOT show Cancel & Refund
    const s3Row = page.locator(`tr:has-text("tc075-s3-${testId}")`);
    await expect(s3Row).toBeVisible({ timeout: 10_000 });
    const s3CancelBtn = s3Row.getByRole('button', { name: /Cancel & Refund/i });
    await expect(s3CancelBtn).toHaveCount(0);

    console.log('TC-075 evidence:', JSON.stringify({
      airwallex_has_button: true,
      s3_no_button: true,
      testId,
    }));
  });
});
