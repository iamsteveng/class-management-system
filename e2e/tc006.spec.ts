import { test, expect } from '@playwright/test';

const TOKEN = '291f596f-10ec-4b27-86a9-175153155ca8';

test('TC-006: Terms page loads with valid token', async ({ page }) => {
  await page.goto(`/terms?token=${TOKEN}`);
  await page.waitForLoadState('networkidle');
  
  const body = page.locator('body');
  await expect(body).toContainText('+6591234567');
  await expect(body).toContainText('Cycling Fundamentals');
  await expect(page.locator('select#session_id')).toBeVisible();
  
  await page.screenshot({ path: 'e2e/tc006-screenshot.png', fullPage: true });
});
