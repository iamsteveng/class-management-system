import { test, expect } from '@playwright/test';
import path from 'path';

// TC-060: Passes page renders N pass cards from the ?tokens= URL param,
// shows the WhatsApp reminder banner and correct participant count.
const KNOWN_CLASS_ID = '67261272-c799-4439-9146-4ee12ce51b7c';
const BASE_URL = 'http://localhost:3000';

test.describe('TC-060: Passes page renders participant pass cards', () => {
  test('TC-060 three tokens in URL → three pass cards, each with Copy and Fill Details', async ({ page }) => {
    const tokens = ['aaaaaaaa-0001-0001-0001-000000000001', 'aaaaaaaa-0002-0002-0002-000000000002', 'aaaaaaaa-0003-0003-0003-000000000003'];
    const mobile = '+85298765432';

    await page.goto(
      `${BASE_URL}/apply/${KNOWN_CLASS_ID}/passes?tokens=${tokens.join(',')}&mobile=${encodeURIComponent(mobile)}&lang=zh-TW`
    );
    await page.waitForLoadState('networkidle');

    // WhatsApp reminder banner visible
    const banner = page.locator('div.rounded-xl.border-emerald-200');
    await expect(banner).toBeVisible({ timeout: 10_000 });
    await expect(banner).toContainText(mobile);

    // 3 pass cards (each has a "複製連結" button)
    const copyButtons = page.getByRole('button', { name: '複製連結' });
    await expect(copyButtons).toHaveCount(3);

    // 3 Fill Details links
    const fillButtons = page.getByRole('link', { name: '填寫資料' });
    await expect(fillButtons).toHaveCount(3);

    // Each Fill Details href points to the correct terms URL
    const hrefs = await fillButtons.evaluateAll((els) => els.map((el) => el.getAttribute('href')));
    expect(hrefs[0]).toContain(`token=${tokens[0]}`);
    expect(hrefs[1]).toContain(`token=${tokens[1]}`);
    expect(hrefs[2]).toContain(`token=${tokens[2]}`);

    const screenshotDir = path.join(process.cwd(), 'test-results');
    await page.screenshot({ path: path.join(screenshotDir, 'tc-060-passes-page.png'), fullPage: true });

    console.log('TC-060 evidence:', JSON.stringify({ card_count: 3, banner_shown: true }));
  });
});
