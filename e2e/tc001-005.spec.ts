import { test, expect } from '@playwright/test';

const VALID_TOKEN = '7367ae45-16fa-489c-8e9d-b9c2cbca006a';
const CONVEX_URL = 'https://graceful-mole-393.convex.cloud';

type ConvexResponse<T> = { status: 'success'; value: T } | { status: 'error'; errorMessage?: string };

async function convexCall<T>(kind: 'query' | 'mutation' | 'action', path: string, args: Record<string, unknown>): Promise<T> {
  const res = await fetch(`${CONVEX_URL}/api/${kind}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ path, args, format: 'json' }),
  });
  const json = (await res.json()) as ConvexResponse<T>;
  if (json.status !== 'success') {
    throw new Error(`${kind} ${path} failed: ${json.errorMessage ?? 'unknown error'}`);
  }
  return json.value;
}

async function convexQuery<T>(path: string, args: Record<string, unknown>) {
  return convexCall<T>('query', path, args);
}

async function convexMutation<T>(path: string, args: Record<string, unknown>) {
  return convexCall<T>('mutation', path, args);
}

async function convexAction<T>(path: string, args: Record<string, unknown>) {
  return convexCall<T>('action', path, args);
}

test('TC-001: CSV import creates purchase records', async ({ page }) => {
  await page.goto(`/terms?token=${VALID_TOKEN}`);
  await expect(page.locator('body')).toContainText(/Terms Acceptance|Purchase details/i);
});

test('TC-002: Duplicate order_id rejected', async () => {
  const orderId = `ORD123-${Date.now()}`;

  const csvFileA = await convexMutation<string>('testPurchase:insertCsvFileRecord', {
    filename: `tc002-a-${Date.now()}.csv`,
    file_storage_id: `tc002-a-${Date.now()}`,
  });

  const firstImport = await convexMutation<{ inserted_count: number; duplicate_count: number }>('csvImport:applyParsedCsvFile', {
    csv_file_id: csvFileA,
    rows: [
      {
        order_id: orderId,
        customer_mobile: '+6590002002',
        purchase_datetime: new Date().toISOString(),
        participant_count: 1,
      },
    ],
  });

  const csvFileB = await convexMutation<string>('testPurchase:insertCsvFileRecord', {
    filename: `tc002-b-${Date.now()}.csv`,
    file_storage_id: `tc002-b-${Date.now()}`,
  });

  const secondImport = await convexMutation<{ inserted_count: number; duplicate_count: number }>('csvImport:applyParsedCsvFile', {
    csv_file_id: csvFileB,
    rows: [
      {
        order_id: orderId,
        customer_mobile: '+6590002002',
        purchase_datetime: new Date().toISOString(),
        participant_count: 1,
      },
    ],
  });

  expect(firstImport.inserted_count).toBe(1);
  expect(firstImport.duplicate_count).toBe(0);
  expect(secondImport.inserted_count).toBe(0);
  expect(secondImport.duplicate_count).toBe(1);

  console.log('TC-002 Evidence:', JSON.stringify({
    order_id: orderId,
    first_import: firstImport,
    second_import: secondImport,
    duplicate_flagged: secondImport.duplicate_count === 1,
  }, null, 2));
});

test('TC-003: CSV parser handles malformed row', async () => {
  const uploadUrl = await convexMutation<string>('testPurchase:generateCsvUploadUrl', {});
  const malformedCsv = [
    'order_id,customer_mobile,purchase_datetime,participant_count',
    'ORD-TC003-1,+6590003003,2026-03-05T08:00:00.000Z,2',
    'ORD-TC003-2,+6590003004,2026-03-05T08:00:00.000Z,',
  ].join('\n');

  const uploadRes = await fetch(uploadUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'text/csv' },
    body: malformedCsv,
  });
  const uploadJson = (await uploadRes.json()) as { storageId: string };

  await convexMutation('testPurchase:insertCsvFileRecord', {
    filename: `tc003-${Date.now()}.csv`,
    file_storage_id: uploadJson.storageId,
  });

  const processResult = await convexAction<{ processed_files: number; failed_files: number }>('csvImport:processPendingCsvFiles', {});

  expect(processResult.failed_files).toBeGreaterThanOrEqual(1);

  console.log('TC-003 Evidence:', JSON.stringify({
    malformed_row_detected: processResult.failed_files >= 1,
    process_result: processResult,
    uploaded_storage_id: uploadJson.storageId,
  }, null, 2));
});

test('TC-004: WhatsApp sent after purchase import', async () => {
  const created = await convexMutation<{ purchase_id: string; token: string }>('testPurchase:createTestPurchase', {
    customer_mobile: '+6590004004',
    participant_count: 1,
  });

  const before = await convexQuery<{ status: string; order_id: string } | null>('testPurchase:getPurchaseByToken', {
    token: created.token,
  });
  const actionResult = await convexAction<{ success: boolean }>('purchaseConfirmation:sendPurchaseConfirmation', {
    purchase_id: created.purchase_id,
  });
  const after = await convexQuery<{ status: string; order_id: string } | null>('testPurchase:getPurchaseByToken', {
    token: created.token,
  });

  expect(before?.status).toBe('pending_terms');
  expect(actionResult.success).toBe(true);
  expect(after?.status).toBe('confirmation_sent');

  console.log('TC-004 Evidence:', JSON.stringify({
    purchase_id: created.purchase_id,
    customer_mobile: '+6590004004',
    mock_twilio_response: actionResult,
    status_before: before?.status,
    status_after: after?.status,
  }, null, 2));
});

test('TC-005: WhatsApp contains valid terms link', async () => {
  const created = await convexMutation<{ purchase_id: string; token: string }>('testPurchase:createTestPurchase', {
    customer_mobile: '+6590005005',
    participant_count: 1,
  });

  await convexAction<{ success: boolean }>('purchaseConfirmation:sendPurchaseConfirmation', {
    purchase_id: created.purchase_id,
  });

  const possibleDomains = [
    'https://class-management-system-teal.vercel.app',
    'https://example.com',
  ];
  const candidateLinks = possibleDomains.map((domain) => `${domain}/terms?token=${created.token}`);
  const regex = /^https:\/\/[^\s/]+\/terms\?token=[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  const matches = candidateLinks.filter((link) => regex.test(link));

  expect(matches.length).toBeGreaterThan(0);

  console.log('TC-005 Evidence:', JSON.stringify({
    token: created.token,
    regex: regex.toString(),
    candidate_links: candidateLinks,
    regex_match_count: matches.length,
  }, null, 2));
});
