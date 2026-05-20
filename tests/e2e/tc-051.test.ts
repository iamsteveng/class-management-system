import { test, expect } from '@playwright/test';
import path from 'path';

// TC-051: Homepage shows "Apply" link (not "Buy Ticket") for a class with airwallex_price.
// Uses route interception so the test is deterministic regardless of prod DB state.
const KNOWN_CLASS_ID = '67261272-c799-4439-9146-4ee12ce51b7c';
const BASE_URL = 'http://localhost:3000';

test.describe('TC-051: Homepage shows Apply button for Airwallex-priced class', () => {
  test('TC-051 homepage renders Apply link to /apply/[class_id] when airwallex_price is set, not Buy Ticket', async ({ page }) => {
    const testId = Date.now();
    const className = `TC051 Airwallex Class ${testId}`;

    await page.route('**/api/classes', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          classes: [
            {
              class_id: KNOWN_CLASS_ID,
              name_zh: className,
              airwallex_price: 1200,
              airwallex_currency: 'HKD',
            },
          ],
        }),
      });
    });
    await page.route(`**/api/classes/${KNOWN_CLASS_ID}/sessions`, async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ sessions: [] }) });
    });

    await page.goto(BASE_URL);

    // Class heading must be visible
    await expect(page.getByRole('heading', { name: className })).toBeVisible({ timeout: 15_000 });

    // "Apply" link pointing to /apply/[class_id] must be present
    const applyLink = page.getByRole('link', { name: 'Apply' });
    await expect(applyLink).toBeVisible({ timeout: 10_000 });
    const href = await applyLink.getAttribute('href');
    expect(href).toBe(`/apply/${KNOWN_CLASS_ID}`);

    // "Buy Ticket" (external payment_url link) must NOT appear for this class
    await expect(page.getByRole('link', { name: 'Buy Ticket' })).toHaveCount(0);

    const screenshotDir = path.join(process.cwd(), 'test-results');
    await page.screenshot({ path: path.join(screenshotDir, 'tc-051-apply-button.png'), fullPage: true });

    console.log('TC-051 evidence:', JSON.stringify({
      class_id: KNOWN_CLASS_ID,
      apply_link_href: href,
      buy_ticket_visible: false,
    }, null, 2));
  });
});
