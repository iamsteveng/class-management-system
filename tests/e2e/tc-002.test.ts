import { test, expect } from '@playwright/test';
import path from 'path';

// The homepage CoursesSection only renders classes whose class_id appears in
// the hardcoded getCourseConfig() map. Use route interception + a known config
// class_id so the enroll link is rendered.
const KNOWN_CLASS_ID = '67261272-c799-4439-9146-4ee12ce51b7c';
const BASE_URL = 'http://localhost:3000';

test.describe('TC-002: Buy Ticket button opens payment_url in new tab', () => {
  test('TC-002 Buy Ticket anchor has target=_blank, rel=noopener noreferrer, and opens payment_url in new tab', async ({ page, context }) => {
    const testId = Date.now();
    const className = `TC002 Buy Ticket ${testId}`;
    const paymentUrl = `https://example.com/pay-tc002-${testId}`;

    await page.route('**/api/classes', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          classes: [
            { class_id: KNOWN_CLASS_ID, name_zh: className, payment_url: paymentUrl },
          ],
        }),
      });
    });
    await page.route(`**/api/classes/${KNOWN_CLASS_ID}/sessions`, async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ sessions: [] }) });
    });

    await page.goto(BASE_URL);

    // Heading must be visible
    await expect(page.getByRole('heading', { name: className })).toBeVisible({ timeout: 15_000 });

    // Locate the enroll link by href (button text is zh-TW '按此報名', not 'Buy Ticket')
    const enrollLink = page.locator(`a[href="${paymentUrl}"]`);
    await expect(enrollLink).toBeVisible({ timeout: 10_000 });

    const targetAttr = await enrollLink.getAttribute('target');
    const relAttr = await enrollLink.getAttribute('rel');
    const hrefAttr = await enrollLink.getAttribute('href');

    expect(targetAttr, 'Enroll anchor must have target="_blank"').toBe('_blank');
    expect(relAttr, 'Enroll anchor must have rel="noopener noreferrer"').toBe('noopener noreferrer');
    expect(hrefAttr, 'Enroll anchor href must match payment_url').toBe(paymentUrl);

    const [newPage] = await Promise.all([
      context.waitForEvent('page'),
      enrollLink.click(),
    ]);
    await newPage.waitForLoadState('domcontentloaded');
    expect(newPage.url()).toContain('example.com/pay-tc002');

    const screenshotDir = path.join(process.cwd(), 'test-results');
    await page.screenshot({ path: path.join(screenshotDir, 'tc-002-anchor-attributes.png'), fullPage: true });
    await newPage.screenshot({ path: path.join(screenshotDir, 'tc-002-new-tab.png'), fullPage: true });

    console.log('TC-002 evidence:', JSON.stringify({
      class_id: KNOWN_CLASS_ID,
      payment_url: paymentUrl,
      anchor_target: targetAttr,
      anchor_rel: relAttr,
      anchor_href: hrefAttr,
      new_tab_url: newPage.url(),
    }, null, 2));
  });
});
