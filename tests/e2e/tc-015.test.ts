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

test.describe('TC-015: Terms success state shows green tick and confirmation message', () => {
  test('TC-015 success state displays green tick icon and confirmation text', async ({ page }) => {
    // Create a test purchase to get a valid token
    const result = await convexMutation('testPurchase:createTestPurchase', {
      customer_mobile: '+6599015015',
    }) as { token: string };
    const token = result.token;

    // Navigate directly to success state URL
    await page.goto(`${BASE_URL}/terms?token=${token}&status=success`);
    await page.waitForLoadState('networkidle');

    const screenshotDir = path.join(process.cwd(), 'test-results');

    // Screenshot evidence of success state
    await page.screenshot({ path: path.join(screenshotDir, 'tc-015-success-state.png'), fullPage: true });

    // Pass criteria 1: green tick icon is visible (SVG inside emerald circle)
    const greenTickContainer = page.locator('div.rounded-full.bg-emerald-100');
    await expect(greenTickContainer).toBeVisible({ timeout: 15_000 });

    const tickSvg = greenTickContainer.locator('svg');
    await expect(tickSvg).toBeVisible({ timeout: 10_000 });

    // Pass criteria 2: confirmation message text is displayed
    const confirmationText = page.getByText('Your class application is confirmed');
    await expect(confirmationText).toBeVisible({ timeout: 10_000 });

    console.log('TC-015 evidence:', JSON.stringify({
      token,
      green_tick_visible: true,
      confirmation_text_visible: true,
      url: page.url(),
    }, null, 2));
  });
});
