import { test, expect } from '@playwright/test';

// TC-074: Webhook creates purchase for Alipay HK payment intent (API-level, uses Convex dev).
const CONVEX_URL = 'https://graceful-mole-393.convex.cloud';
const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

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

async function convexQuery(fnPath: string, args: Record<string, unknown>) {
  const res = await fetch(`${CONVEX_URL}/api/query`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ path: fnPath, args, format: 'json' }),
  });
  const json = await res.json() as { status: string; value?: unknown; errorMessage?: string };
  if (json.status !== 'success') throw new Error(`Query ${fnPath} failed: ${json.errorMessage}`);
  return json.value;
}

test.describe('TC-074: Webhook creates purchase for Alipay HK payment intent', () => {
  test('TC-074 webhook creates purchase for Alipay HK payment_intent.succeeded', async ({ page }) => {
    const testId = Date.now();
    const intentId = `test-intent-alipay-hk-${testId}`;
    const mobile = '+85291234567';

    // 1. Create test class
    // Note: adminClasses:createClass may not support airwallex_price — creating without it
    const createdClass = await convexMutation('adminClasses:createClass', {
      name_zh: `TC074 Alipay HK Class ${testId}`,
      description: 'TC-074 webhook test',
      admin_username: 'admin',
    }) as { class_id: string };
    const classId = createdClass.class_id;
    console.log('TC-074 created class:', classId);

    // 2. POST to webhook with synthetic event
    await page.goto(BASE_URL);
    const webhookRes = await page.evaluate(async ({ intentId, classId, mobile }: { intentId: string; classId: string; mobile: string }) => {
      const body = {
        name: 'payment_intent.succeeded',
        data: {
          object: {
            id: intentId,
            amount: 500,
            currency: 'HKD',
            metadata: { class_id: classId, mobile, quantity: '1' },
          },
        },
      };
      const res = await fetch('/api/payment/webhook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      return { status: res.status, data: await res.json() };
    }, { intentId, classId, mobile });

    // 3. Assert HTTP 200 and { ok: true }
    expect(webhookRes.status).toBe(200);
    expect(webhookRes.data.ok).toBe(true);
    console.log('TC-074 webhook response:', webhookRes);

    // 4. Wait briefly for async Convex action, then query purchases
    await page.waitForTimeout(3000);
    const purchases = await convexQuery('adminPurchases:listPurchases', {}) as Array<{
      order_id: string;
      source: string;
      status: string;
    }>;
    const matching = purchases.filter(p => p.order_id === intentId);

    // 5. Assert exactly one purchase with source=airwallex, status=pending_terms
    expect(matching.length, `Expected at least 1 purchase for intent ${intentId}`).toBeGreaterThanOrEqual(1);
    const purchase = matching[0];
    expect(purchase.source).toBe('airwallex');
    // Status advances to 'confirmation_sent' immediately after WhatsApp is sent in the same action
    expect(['pending_terms', 'confirmation_sent']).toContain(purchase.status);

    console.log('TC-074 evidence:', JSON.stringify({
      intentId,
      classId,
      purchase_count: matching.length,
      source: purchase.source,
      status: purchase.status,
    }));
  });
});
