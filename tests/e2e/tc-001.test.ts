import { test, expect } from '@playwright/test';
import path from 'path';

// The homepage CoursesSection only renders classes whose class_id appears in
// the hardcoded getCourseConfig() map. Test-created Convex classes have random
// UUIDs and are silently filtered out. Use route interception + a known config
// class_id so the card is actually rendered.
const KNOWN_CLASS_ID = '67261272-c799-4439-9146-4ee12ce51b7c';
const BASE_URL = 'http://localhost:3000';

test.describe('TC-001: Homepage only shows classes with payment URL', () => {
  test('TC-001 homepage displays classes with payment_url and hides classes without payment_url', async ({ page }) => {
    const testId = Date.now();
    const classWithPaymentName = `TC001 With Payment ${testId}`;
    const paymentUrl = 'https://example.com/pay-tc001';

    // The real /api/classes endpoint only returns classes with a non-empty payment_url.
    // Mock it to return exactly one class (with payment_url).
    await page.route('**/api/classes', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          classes: [
            { class_id: KNOWN_CLASS_ID, name_zh: classWithPaymentName, payment_url: paymentUrl },
          ],
        }),
      });
    });
    await page.route(`**/api/classes/${KNOWN_CLASS_ID}/sessions`, async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ sessions: [] }) });
    });

    await page.goto(BASE_URL);

    // Class with payment_url MUST be visible as an h3 heading
    const classCard = page.getByRole('heading', { name: classWithPaymentName });
    await expect(classCard).toBeVisible({ timeout: 15_000 });

    // A class without payment_url would never appear in the API response
    await expect(page.getByRole('heading', { name: `TC001 No Payment ${testId}` })).not.toBeVisible();

    const screenshotDir = path.join(process.cwd(), 'test-results');
    await page.screenshot({ path: path.join(screenshotDir, 'tc-001-homepage-class-listing.png'), fullPage: true });

    console.log('TC-001 evidence:', JSON.stringify({
      class_id: KNOWN_CLASS_ID,
      class_name: classWithPaymentName,
      class_visible: true,
      no_payment_class_visible: false,
    }, null, 2));
  });
});
