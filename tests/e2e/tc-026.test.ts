import { test, expect } from '@playwright/test';
import path from 'path';

const BASE_URL = 'http://localhost:3000';

test.describe('TC-026: Admin FAQ — "FAQ" menu entry navigates to management page', () => {
  test('TC-026 FAQ link is visible in admin nav and navigates to /admin/faq', async ({ page }) => {
    const screenshotDir = path.join(process.cwd(), 'test-results');

    // Step 1: Log in as super admin
    await page.goto(`${BASE_URL}/admin/login`);
    await page.getByLabel('Username').fill('admin');
    await page.getByLabel('Password').fill('admin123');
    await page.getByRole('button', { name: 'Sign In' }).click();
    await page.waitForURL(/\/admin\/dashboard/, { timeout: 20_000 });

    // Step 2: Assert FAQ link is visible in admin nav
    const faqLink = page.getByRole('link', { name: 'FAQ' });
    await expect(faqLink).toBeVisible({ timeout: 10_000 });

    // Screenshot of nav with FAQ entry
    await page.screenshot({
      path: path.join(screenshotDir, 'tc-026-admin-nav-faq.png'),
    });

    console.log('TC-026 evidence: FAQ link is visible in admin nav');

    // Step 3: Click the FAQ link and verify navigation
    await faqLink.click();
    await page.waitForURL(/\/admin\/faq/, { timeout: 15_000 });

    const currentUrl = page.url();
    console.log(`TC-026 evidence: navigated to ${currentUrl}`);
    expect(currentUrl).toContain('/admin/faq');

    // Screenshot after navigation
    await page.screenshot({
      path: path.join(screenshotDir, 'tc-026-admin-faq-page.png'),
      fullPage: true,
    });

    console.log('TC-026 PASS: FAQ link visible in admin nav and navigates to /admin/faq');
  });
});
