import { test, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:3001';

test('TC-037: Run history table shows last 20 runs with correct columns', async ({ page }) => {
  // Login as admin
  await page.goto(`${BASE_URL}/admin/login`);
  await page.fill('input[name="username"]', 'admin');
  await page.fill('input[name="password"]', 'admin123');
  await page.click('button[type="submit"]');
  await page.waitForURL(/\/admin\/dashboard/);

  // Navigate to ingestion page
  await page.goto(`${BASE_URL}/admin/ingestion`);
  await page.waitForLoadState('networkidle');

  // Take debug screenshot
  await page.screenshot({ path: 'tc-037-debug.png' });

  // Assert exactly 20 rows in table body
  const rows = page.locator('tbody tr');
  await expect(rows).toHaveCount(20);

  // Assert all required columns are present in thead
  const headers = await page.locator('thead th').allTextContents();
  const headerTexts = headers.map(h => h.trim().toLowerCase());

  expect(headerTexts.some(h => h.includes('timestamp'))).toBe(true);
  expect(headerTexts.some(h => h.includes('status'))).toBe(true);
  expect(headerTexts.some(h => h.includes('files processed'))).toBe(true);
  expect(headerTexts.some(h => h.includes('rows inserted'))).toBe(true);
  expect(headerTexts.some(h => h.includes('rows skipped'))).toBe(true);
  expect(headerTexts.some(h => h.includes('error'))).toBe(true);

  // Take screenshot for evidence
  await page.screenshot({ path: 'tc-037-evidence.png', fullPage: false });
});
