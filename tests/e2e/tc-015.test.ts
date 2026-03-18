import { test, expect } from '@playwright/test';
import path from 'path';

const BASE_URL = 'https://class-management-system-teal.vercel.app';

test.describe('TC-015: Admin terms — "Terms" menu entry is visible and navigates to page', () => {
  test('TC-015 Terms link is visible in admin nav and navigates to /admin/terms', async ({ page }) => {
    // Log in as admin
    await page.goto(`${BASE_URL}/admin/login`);
    await page.getByLabel('Username').fill('admin');
    await page.getByLabel('Password').fill('admin123');
    await page.getByRole('button', { name: 'Sign In' }).click();
    await page.waitForURL(/\/admin\/dashboard/, { timeout: 20_000 });

    // Assert "Terms" link is visible in the nav
    const termsLink = page.getByRole('link', { name: 'Terms' });
    await expect(termsLink).toBeVisible({ timeout: 10_000 });

    // Screenshot evidence of nav with Terms entry
    const screenshotDir = path.join(process.cwd(), 'test-results');
    await page.screenshot({ path: path.join(screenshotDir, 'tc-015-nav-terms.png'), fullPage: false });

    // Click the Terms link and assert navigation to /admin/terms
    await termsLink.click();
    await page.waitForURL(/\/admin\/terms/, { timeout: 15_000 });

    expect(page.url()).toContain('/admin/terms');

    // Screenshot evidence after navigation
    await page.screenshot({ path: path.join(screenshotDir, 'tc-015-terms-page.png'), fullPage: true });

    console.log('TC-015 evidence:', JSON.stringify({
      terms_link_visible: true,
      url_after_click: page.url(),
    }, null, 2));
  });
});
