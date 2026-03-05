import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

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

async function convexQuery(apiPath: string, args: Record<string, unknown>) {
  const res = await fetch(`${CONVEX_URL}/api/query`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ path: apiPath, args, format: 'json' }),
  });
  const json = await res.json() as { status: string; value?: unknown; errorMessage?: string };
  if (json.status !== 'success') throw new Error(`Query ${apiPath} failed: ${json.errorMessage}`);
  return json.value;
}

test('TC-013: QR code encodes participant_id', async ({ page }) => {
  // Step 1: Create a test purchase and participant
  const result = await convexMutation('testPurchase:createTestPurchase', {
    customer_mobile: '+6599013013',
  }) as { token: string; purchase_id: string };
  const token = result.token;

  // Step 2: Get an available session
  const termsData = await convexQuery('terms:getTermsPageData', { token }) as {
    sessions: Array<{ session_id: string }>;
  } | null;

  expect(termsData, 'Terms page data must be available').not.toBeNull();
  expect(termsData!.sessions.length, 'At least one session must be available').toBeGreaterThan(0);

  const sessionId = termsData!.sessions[0].session_id;

  // Step 3: Accept terms to create participant
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

  // Step 5: Get expected qr_code_data from Convex
  const pageDataResult = await convexQuery('participants:getParticipantPageData', {
    participant_id: participantId,
  }) as { qr_code_data: string } | null;

  expect(pageDataResult, 'Participant page data must be available').not.toBeNull();
  const expectedQrData = pageDataResult!.qr_code_data;

  // Step 6: Serve the qr-scanner worker so it can be dynamically imported in the browser
  const workerContent = fs.readFileSync(
    path.resolve('node_modules/qr-scanner/qr-scanner-worker.min.js'),
    'utf8'
  );
  const umdContent = fs.readFileSync(
    path.resolve('node_modules/qr-scanner/qr-scanner.umd.min.js'),
    'utf8'
  );

  await page.route('**/qr-scanner-worker.min.js', (route) => {
    route.fulfill({
      status: 200,
      contentType: 'application/javascript',
      body: workerContent,
    });
  });

  // Step 7: Load participant page
  await page.goto(`/participant/${encodeURIComponent(participantId)}`);
  await page.waitForLoadState('networkidle');

  // Step 8: Inject qr-scanner UMD bundle
  await page.addScriptTag({ content: umdContent });

  // Step 9: Get QR code image src (data URL)
  const qrCodeImage = page.locator('img[alt*="QR code"]');
  await expect(qrCodeImage).toBeVisible();
  const qrSrc = await qrCodeImage.getAttribute('src');
  expect(qrSrc, 'QR code src must be a data URL').toMatch(/^data:image\//);

  // Step 10: Scan QR code using qr-scanner
  const decoded = await page.evaluate(async (dataUrl: string) => {
    const QrScanner = (window as unknown as { QrScanner: { scanImage: (src: string, opts: object) => Promise<{ data: string }> } }).QrScanner;
    try {
      const result = await QrScanner.scanImage(dataUrl, { returnDetailedScanResult: true });
      return { data: result.data, error: null };
    } catch (e: unknown) {
      return { data: null, error: String(e) };
    }
  }, qrSrc!);

  // Step 11: Verify decoded QR data equals participant_id
  expect(decoded.data, `QR scan error: ${decoded.error}`).not.toBeNull();
  expect(decoded.data, `Decoded QR data must equal participant_id UUID`).toBe(expectedQrData);
  expect(decoded.data, `Decoded QR data must equal participant_id UUID`).toBe(participantId);

  // Evidence output
  console.log('TC-013 Evidence:', JSON.stringify({
    participant_id: participantId,
    expected_qr_data: expectedQrData,
    decoded_qr_data: decoded.data,
    match: decoded.data === participantId,
  }, null, 2));

  await page.screenshot({ path: 'e2e/tc013-screenshot.png', fullPage: true });
});
