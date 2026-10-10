import { test, expect } from '@playwright/test';
import path from 'path';

import { fillTestCard } from './helpers/applyFixture';

// TC-082: The cycling landing page. Filtering by Class and district narrows the session
// list; picking a Session on a Class card and booking it in the side sheet seats a
// Participant (paid by Airwallex demo card). Requires REVAMP_HOMEPAGE=on and the
// catalogue seed on the deployment under test.

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

test.describe('TC-082: cycling landing page', () => {
  test('TC-082 filter to 幼兒班 at 青衣 and book a Session from the sheet', async ({ page }) => {
    test.setTimeout(120_000);
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(BASE_URL);
    await expect(page.getByRole('heading', { name: /學識踩單車/ })).toBeVisible();

    await page.getByRole('radiogroup', { name: '班別' }).getByRole('radio', { name: /^5–12 歲/ }).click();
    await page.getByRole('group', { name: '地區' }).getByRole('button', { name: '青衣' }).click();
    await expect(page).toHaveURL(/class=class_cycling_kids/);
    await expect(page).toHaveURL(/district=venue_ty/);

    const rows = page.locator('[data-row-session]');
    await expect(rows.first()).toBeVisible();
    for (const text of await rows.allTextContents()) {
      expect(text).toContain('幼兒班');
      expect(text).toContain('青衣');
    }
    // Only the 幼兒班 card is shown
    await expect(page.getByTestId('book-class_cycling_regular')).toHaveCount(0);

    // Pick the second open tile and book it
    const tiles = page.locator('[data-tile-session][aria-disabled="false"]');
    const tile = tiles.nth(1);
    const sessionId = await tile.getAttribute('data-tile-session');
    await tile.click();
    await expect(tile).toHaveAttribute('aria-checked', 'true');
    await page.getByTestId('book-class_cycling_kids').click();

    const sheet = page.getByRole('dialog');
    await expect(sheet).toBeVisible();
    await expect(sheet.getByTestId('selected-session')).toBeVisible();
    await page.screenshot({ path: path.join('test-results', 'tc-082-sheet.png') });

    await sheet.locator('input[name="customer_mobile"]').fill('+85291082082');
    await sheet.locator('input[name="p0_name"]').fill('陳小明');
    await sheet.locator('input[name="p0_age"]').fill('7');
    await sheet.locator('input[name="p0_height"]').fill('120');
    await sheet.locator('input[name="p0_emergency_name"]').fill('陳太');
    await sheet.locator('input[name="p0_emergency_phone"]').fill('+85291082082');
    await sheet.locator('input[name="terms_accepted"]').check();
    await fillTestCard(page);
    await sheet.getByRole('button', { name: '確認並付款' }).click();

    await page.waitForURL(/\/done\?hold=/, { timeout: 60_000 });
    await expect(page.locator('[data-participant-card]')).toHaveCount(1);
    expect(sessionId).toBeTruthy();
  });

  test('TC-082 "change" in the sheet goes back to the Class card', async ({ page }) => {
    await page.goto(BASE_URL);
    await page.getByTestId('book-class_cycling_regular').click();
    const sheet = page.getByRole('dialog');
    await sheet.getByRole('button', { name: '更改' }).click();
    await expect(sheet).toHaveCount(0);
    await expect(page).toHaveURL(/#course-class_cycling_regular/);
  });
});
