import { test, expect } from '@playwright/test';
import path from 'path';

const BASE_URL = 'http://localhost:3000';

test.describe('TC-003: Homepage shows empty state when no classes have payment_url', () => {
  test('TC-003 homepage displays empty state message when API returns no classes', async ({ page }) => {
    // Intercept the /api/classes endpoint to return an empty list
    // This ensures the test is deterministic regardless of prod data state
    await page.route('**/api/classes', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ classes: [] }),
      });
    });

    // Navigate to homepage
    await page.goto(BASE_URL);

    // Wait for loading spinner to disappear
    await expect(page.getByText('Loading classes...')).toBeHidden({ timeout: 15000 });

    // Verify empty state message is visible
    const emptyState = page.getByText('No classes available at this time.');
    await expect(emptyState).toBeVisible({ timeout: 10000 });

    // Verify no class cards (Buy Ticket links) are rendered
    const buyTicketLinks = page.getByRole('link', { name: 'Buy Ticket' });
    await expect(buyTicketLinks).toHaveCount(0);

    // Screenshot evidence
    const screenshotDir = path.join(process.cwd(), 'test-results');
    await page.screenshot({ path: path.join(screenshotDir, 'tc-003-homepage-empty-state.png'), fullPage: true });

    console.log('TC-003 evidence:', JSON.stringify({
      empty_state_visible: true,
      no_class_cards: true,
      empty_state_text: 'No classes available at this time.',
    }, null, 2));
  });
});
