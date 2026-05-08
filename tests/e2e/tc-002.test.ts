import { test, expect } from '@playwright/test';
import path from 'path';

const CONVEX_URL = 'https://graceful-mole-393.convex.cloud';
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

test.describe('TC-002: Buy Ticket button opens payment_url in new tab', () => {
  test('TC-002 Buy Ticket anchor has target=_blank, rel=noopener noreferrer, and opens payment_url in new tab', async ({ page, context }) => {
    const testId = Date.now();
    const className = `TC002 Buy Ticket ${testId}`;
    const paymentUrl = `https://example.com/pay-tc002-${testId}`;

    // Step 1: Seed — create a class with a payment_url
    const classResult = await convexMutation('adminClasses:createClass', {
      name: className,
      description: 'TC-002 test class for Buy Ticket button',
      payment_url: paymentUrl,
      admin_username: 'admin',
    }) as { class_id: string };

    try {
      // Step 2: Navigate to homepage
      await page.goto(BASE_URL);

      // Step 3: Wait for class listing to load
      await expect(page.getByText('Loading classes...')).toBeHidden({ timeout: 15000 });

      // Step 4: Find the Buy Ticket anchor for our test class
      const classCard = page.getByRole('heading', { name: className });
      await expect(classCard).toBeVisible({ timeout: 10000 });

      // Find the anchor within the same card container
      const buyTicketLink = page.locator(`a[href="${paymentUrl}"]`);
      await expect(buyTicketLink).toBeVisible({ timeout: 10000 });

      // Step 5: Verify anchor attributes (target=_blank, rel=noopener noreferrer)
      const targetAttr = await buyTicketLink.getAttribute('target');
      const relAttr = await buyTicketLink.getAttribute('rel');
      const hrefAttr = await buyTicketLink.getAttribute('href');

      expect(targetAttr, 'Buy Ticket anchor must have target="_blank"').toBe('_blank');
      expect(relAttr, 'Buy Ticket anchor must have rel="noopener noreferrer"').toBe('noopener noreferrer');
      expect(hrefAttr, 'Buy Ticket anchor href must match payment_url').toBe(paymentUrl);

      // Step 6: Screenshot of DOM anchor attributes
      const screenshotDir = path.join(process.cwd(), 'test-results');
      await page.screenshot({ path: path.join(screenshotDir, 'tc-002-anchor-attributes.png'), fullPage: true });

      // Step 7: Verify clicking opens a new tab with the correct URL
      const [newPage] = await Promise.all([
        context.waitForEvent('page'),
        buyTicketLink.click(),
      ]);
      await newPage.waitForLoadState('domcontentloaded');

      // The new tab URL should start with the payment_url (may redirect to a landing page)
      const newTabUrl = newPage.url();
      // The new tab's initial navigation target should be the payment_url
      expect(newTabUrl, 'New tab should navigate to payment_url').toContain('example.com/pay-tc002');

      // Step 8: Screenshot of new tab URL
      await newPage.screenshot({ path: path.join(screenshotDir, 'tc-002-new-tab.png'), fullPage: true });

      console.log('TC-002 evidence:', JSON.stringify({
        class_id: classResult.class_id,
        payment_url: paymentUrl,
        anchor_target: targetAttr,
        anchor_rel: relAttr,
        anchor_href: hrefAttr,
        new_tab_url: newTabUrl,
      }, null, 2));
    } finally {
      // Cleanup: cancel the test class
      await convexMutation('adminClasses:cancelClass', {
        class_id: classResult.class_id,
        admin_username: 'admin',
      }).catch(() => { /* ignore cleanup errors */ });
    }
  });
});
