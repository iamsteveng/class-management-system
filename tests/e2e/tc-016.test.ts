import { test, expect } from '@playwright/test';
import path from 'path';

const CONVEX_URL = 'https://colorless-raven-523.convex.cloud';
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

test.describe('TC-016: Terms success state shows Open your QR Code button', () => {
  test('TC-016 Open your QR Code button is visible on terms success state when participant_id is present', async ({ page }) => {
    // Create a test purchase to get a valid token
    const result = await convexMutation('testPurchase:createTestPurchase', {
      customer_mobile: '+6599016016',
    }) as { token: string };
    const token = result.token;

    // Use a fake participant_id — page renders the button based on URL param presence only
    const fakeParticipantId = 'tc016-test-participant';

    // Navigate directly to success state URL with participant_id
    await page.goto(`${BASE_URL}/terms?token=${token}&status=success&participant_id=${fakeParticipantId}`);
    await page.waitForLoadState('networkidle');

    const screenshotDir = path.join(process.cwd(), 'test-results');
    await page.screenshot({ path: path.join(screenshotDir, 'tc-016-success-state.png'), fullPage: true });

    // Pass criteria: 'Open your QR Code' button is visible
    const qrButton = page.getByRole('link', { name: 'Open your QR Code' });
    await expect(qrButton).toBeVisible({ timeout: 15_000 });

    // Verify the link href points to the participant page
    const href = await qrButton.getAttribute('href');
    expect(href).toContain(`/participant/${fakeParticipantId}`);

    console.log('TC-016 evidence:', JSON.stringify({
      token,
      participant_id: fakeParticipantId,
      qr_button_visible: true,
      href,
      url: page.url(),
    }, null, 2));
  });
});
