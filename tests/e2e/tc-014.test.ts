import { test, expect } from '@playwright/test';
import path from 'path';

const CONVEX_URL = 'https://graceful-mole-393.convex.cloud';
const BASE_URL = 'http://localhost:3000';

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

test.describe('TC-014: Terms page shows instructional wording about QR code WhatsApp', () => {
  test('TC-014 terms page contains QR code WhatsApp instructional note above submit button', async ({ page }) => {
    // Create a test purchase to get a valid token
    const result = await convexMutation('testPurchase:createTestPurchase', {
      customer_mobile: '+6599014014',
    }) as { token: string };
    const token = result.token;

    // Navigate to the terms page
    await page.goto(`${BASE_URL}/terms?token=${token}`);
    await page.waitForLoadState('networkidle');

    // Screenshot evidence — terms form with instructional note visible
    const screenshotDir = path.join(process.cwd(), 'test-results');
    await page.screenshot({ path: path.join(screenshotDir, 'tc-014-terms-qr-note.png'), fullPage: true });

    // Pass criteria: page contains the instructional text (zh-TW default)
    const instructionalNote = page.locator('text=確認課程時段並接受條款後，你可在此頁面取得 QR 碼。');
    await expect(instructionalNote).toBeVisible({ timeout: 15_000 });

    // Pass criteria: note appears above the submit button
    const noteElement = page.locator('p.italic');
    const submitButton = page.getByRole('button', { name: 'Accept Terms' });

    const noteBox = await noteElement.boundingBox();
    const buttonBox = await submitButton.boundingBox();

    expect(noteBox).not.toBeNull();
    expect(buttonBox).not.toBeNull();
    // Note's bottom edge should be above (or at) the button's top edge
    expect(noteBox!.y + noteBox!.height).toBeLessThanOrEqual(buttonBox!.y + 5);

    console.log('TC-014 evidence:', JSON.stringify({
      token,
      note_visible: true,
      note_y: noteBox!.y,
      note_bottom: noteBox!.y + noteBox!.height,
      button_y: buttonBox!.y,
      note_above_button: (noteBox!.y + noteBox!.height) <= (buttonBox!.y + 5),
    }, null, 2));
  });
});
