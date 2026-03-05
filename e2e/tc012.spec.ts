import { test, expect } from '@playwright/test';

const CONVEX_URL = 'https://graceful-mole-393.convex.cloud';

async function convexMutation(path: string, args: Record<string, unknown>) {
  const res = await fetch(`${CONVEX_URL}/api/mutation`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ path, args, format: 'json' }),
  });
  const json = await res.json() as { status: string; value?: unknown; errorMessage?: string };
  if (json.status !== 'success') throw new Error(`Mutation ${path} failed: ${json.errorMessage}`);
  return json.value;
}

async function convexQuery(path: string, args: Record<string, unknown>) {
  const res = await fetch(`${CONVEX_URL}/api/query`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ path, args, format: 'json' }),
  });
  const json = await res.json() as { status: string; value?: unknown; errorMessage?: string };
  if (json.status !== 'success') throw new Error(`Query ${path} failed: ${json.errorMessage}`);
  return json.value;
}

test('TC-012: Participant page displays QR code', async ({ page }) => {
  // Step 1: Create a test purchase and get a valid participant UUID
  const result = await convexMutation('testPurchase:createTestPurchase', {
    customer_mobile: '+6599012012',
  }) as { token: string; purchase_id: string };
  const token = result.token;

  // Step 2: Get an available session
  const termsData = await convexQuery('terms:getTermsPageData', { token }) as {
    sessions: Array<{ session_id: string }>;
  } | null;

  expect(termsData, 'Terms page data must be available').not.toBeNull();
  expect(termsData!.sessions.length, 'At least one session must be available').toBeGreaterThan(0);

  const sessionId = termsData!.sessions[0].session_id;

  // Step 3: Accept terms to trigger participant creation
  const acceptResult = await convexMutation('terms:acceptTermsByToken', {
    token,
    session_id: sessionId,
    accepted: true,
  }) as { success: boolean; error_message?: string };

  expect(acceptResult.success, `acceptTermsByToken failed: ${acceptResult.error_message}`).toBe(true);

  // Step 4: Get participant UUID
  const participants = await convexQuery('testPurchase:getParticipantsByToken', { token }) as Array<{
    participant_id: string;
    session_id: string;
  }>;

  expect(participants.length, 'Expected at least 1 participant').toBeGreaterThan(0);
  const participantId = participants[0].participant_id;

  // Step 5: Navigate to participant page
  await page.goto(`/participant/${encodeURIComponent(participantId)}`);
  await page.waitForLoadState('networkidle');

  // Step 6: Verify participant details are shown
  const participantIdText = page.locator('dd.break-all');
  await expect(participantIdText).toBeVisible();
  await expect(participantIdText).toContainText(participantId);

  // Step 7: Verify QR code image is present
  const qrCodeImage = page.locator('img[alt*="QR code"]');
  await expect(qrCodeImage).toBeVisible();

  const qrSrc = await qrCodeImage.getAttribute('src');
  expect(qrSrc, 'QR code img src must be a data URL').toMatch(/^data:image\//);

  // Evidence output
  console.log('TC-012 Evidence:', JSON.stringify({
    participant_id: participantId,
    page_url: page.url(),
    qr_code_present: true,
    qr_src_prefix: qrSrc?.substring(0, 30),
  }, null, 2));

  await page.screenshot({ path: 'e2e/tc012-screenshot.png', fullPage: true });
});
