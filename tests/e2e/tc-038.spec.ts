import { test, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:3000';

test('TC-038 Status badges are colour-coded correctly', async ({ page }) => {
  // Login to local dev server
  await page.goto(`${BASE_URL}/admin/login`);
  await page.fill('input[name="username"]', 'admin');
  await page.fill('input[name="password"]', 'admin123');
  await page.click('button[type="submit"]');
  await page.waitForTimeout(2000);
  
  console.log('After login URL:', page.url());
  await page.screenshot({ path: 'tc-038-debug-login.png' });
  
  // Navigate to ingestion page
  await page.goto(`${BASE_URL}/admin/ingestion`);
  await page.waitForTimeout(3000);
  
  console.log('Ingestion page URL:', page.url());
  await page.screenshot({ path: 'tc-038-evidence.png' });
  
  // Dump page content
  const bodyText = await page.locator('body').textContent();
  console.log('Body text (first 500):', bodyText?.substring(0, 500));
  
  // Check badge colours via CSS classes
  const successBadge = page.locator('span.rounded-full.bg-emerald-100').first();
  const partialBadge = page.locator('span.rounded-full.bg-yellow-100').first();
  const errorBadge = page.locator('span.rounded-full.bg-red-100').first();
  
  await expect(successBadge).toBeVisible();
  await expect(partialBadge).toBeVisible();
  await expect(errorBadge).toBeVisible();
  
  console.log('success badge text:', await successBadge.textContent());
  console.log('partial badge text:', await partialBadge.textContent());
  console.log('error badge text:', await errorBadge.textContent());
});
