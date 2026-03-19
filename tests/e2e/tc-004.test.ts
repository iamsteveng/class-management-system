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

test.describe('TC-004: Super admin sees payment URL field in class edit form', () => {
  test('TC-004 payment URL input is visible in class edit form for super_admin', async ({ page }) => {
    // Step 1: Create a test class via Convex mutation to ensure there is a class to edit
    const createdClass = await convexMutation('adminClasses:createClass', {
      name: `TC004 PaymentURL Class ${Date.now()}`,
      description: 'TC-004 payment URL visibility test',
      admin_username: 'admin',
    }) as { class_id: string };

    // Step 2: Log in as super_admin (admin / admin123)
    await page.goto(`${BASE_URL}/admin/login`);
    await page.getByLabel('Username').fill('admin');
    await page.getByLabel('Password').fill('admin123');
    await page.getByRole('button', { name: 'Sign In' }).click();
    await page.waitForURL(/\/admin\/dashboard/, { timeout: 20_000 });

    // Step 3: Navigate to the classes page
    await page.goto(`${BASE_URL}/admin/classes`);
    await page.waitForLoadState('networkidle');

    // Step 4: Find the row for our test class and click its Edit button
    const classRow = page.locator('tbody tr').filter({ hasText: createdClass.class_id });
    await expect(classRow).toBeVisible({ timeout: 15_000 });
    await classRow.getByRole('button', { name: 'Edit' }).click();

    // Step 5: Wait for the Edit Class modal to appear
    await expect(page.getByRole('heading', { name: 'Edit Class' })).toBeVisible({ timeout: 10_000 });

    // Step 6: Assert the Payment URL input field is visible
    const paymentUrlInput = page.locator('input[name="payment_url"]');
    await expect(paymentUrlInput).toBeVisible({ timeout: 5_000 });

    // Step 7: Screenshot evidence
    const screenshotDir = path.join(process.cwd(), 'test-results');
    await page.screenshot({ path: path.join(screenshotDir, 'tc-004-payment-url-field-visible.png'), fullPage: true });

    console.log('TC-004 evidence:', JSON.stringify({
      class_id: createdClass.class_id,
      edit_modal_opened: true,
      payment_url_field_visible: true,
    }, null, 2));
  });
});
