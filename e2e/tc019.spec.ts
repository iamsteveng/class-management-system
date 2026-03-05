import { test, expect } from '@playwright/test';

test('TC-019: Admin can log in with valid credentials', async ({ page, context }) => {
  // Navigate to admin login page
  await page.goto('/admin/login');
  await page.waitForLoadState('networkidle');

  // Enter credentials
  await page.fill('#username', 'admin');
  await page.fill('#password', 'admin123');

  // Submit form
  await page.click('button[type="submit"]');

  // Wait for redirect to dashboard
  await page.waitForURL(/\/admin\/dashboard/, { timeout: 15000 });

  // Check URL
  const currentUrl = page.url();
  console.log('TC-019 Current URL:', currentUrl);
  expect(currentUrl).toContain('/admin/dashboard');

  // Check cookies
  const cookies = await context.cookies();
  console.log('TC-019 Cookies:', JSON.stringify(cookies.map(c => ({ name: c.name, domain: c.domain })), null, 2));
  const sessionCookie = cookies.find(c =>
    c.name.includes('next-auth') || c.name.includes('session') || c.name.startsWith('__Secure') || c.name.startsWith('__Host')
  );

  const evidence = {
    url: currentUrl,
    isDashboard: currentUrl.includes('/admin/dashboard'),
    cookies: cookies.map(c => ({ name: c.name, domain: c.domain })),
    sessionCookieFound: !!sessionCookie,
    sessionCookieName: sessionCookie?.name,
  };
  console.log('TC-019 Evidence:', JSON.stringify(evidence, null, 2));

  expect(currentUrl, 'Should redirect to /admin/dashboard').toContain('/admin/dashboard');
  expect(sessionCookie, 'Session cookie should be set').toBeTruthy();

  await page.screenshot({ path: 'e2e/tc019-screenshot.png', fullPage: true });
});
