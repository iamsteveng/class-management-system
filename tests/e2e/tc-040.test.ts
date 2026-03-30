import { test, expect } from '@playwright/test';

test('TC-040 Ingestion page linked from admin nav', async ({ page }) => {
  await page.goto('https://class-management-system-teal.vercel.app/admin/login');
  await page.fill('input[name="username"]', 'admin');
  await page.fill('input[name="password"]', 'admin123');
  await page.click('button[type="submit"]');
  await page.waitForURL(/\/admin\//);

  // Assert the ingestion link is present in nav
  const ingestionLink = page.getByRole('link', { name: 'Ingestion' });
  await expect(ingestionLink).toBeVisible();
  await expect(ingestionLink).toHaveAttribute('href', '/admin/ingestion');

  // Screenshot evidence
  await page.screenshot({ path: 'tc040-evidence.png', fullPage: false });

  // Click through to verify it's functional
  await ingestionLink.click();
  await page.waitForURL(/\/admin\/ingestion/);
  await page.screenshot({ path: 'tc040-ingestion-page.png', fullPage: false });
});
