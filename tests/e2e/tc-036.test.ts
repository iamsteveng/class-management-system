import { test, expect } from '@playwright/test';

// TC-036 tests the ingestion page which is on the feature branch (not yet deployed to production).
// Run against local dev server: npm run dev
const BASE_URL = 'http://localhost:3000';

test('TC-036: Admin ingestion page shows Poll Now button for super_admin', async ({ page }) => {
  await page.goto(`${BASE_URL}/admin/login`);
  await page.fill('input[name="username"]', 'admin');
  await page.fill('input[name="password"]', 'admin123');
  await page.click('button[type="submit"]');
  await page.waitForURL(/\/admin\/(?!login)/, { timeout: 10000 });

  await page.goto(`${BASE_URL}/admin/ingestion`);
  await page.waitForLoadState('networkidle');

  // Assert page heading is visible
  const heading = page.getByRole('heading', { name: 'S3 Ingestion' });
  await expect(heading).toBeVisible();

  // Assert Poll Now button is visible and clickable
  const pollBtn = page.getByRole('button', { name: 'Poll Now' });
  await expect(pollBtn).toBeVisible();
  await expect(pollBtn).toBeEnabled();

  await page.screenshot({ path: 'tc-036-evidence.png' });
});
