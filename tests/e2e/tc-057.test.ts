import { test, expect } from '@playwright/test';

// TC-057: POST /api/payment/webhook handles events correctly.
// - Unknown event names → { ok: true } with no side effects (no Convex call)
// - payment_intent.succeeded with missing metadata → { ok: true } (warns but does not crash)
const BASE_URL = 'http://localhost:3000';

test.describe('TC-057: /api/payment/webhook handles events gracefully', () => {
  test('TC-057a webhook returns ok:true for unrecognised event name', async ({ request }) => {
    const res = await request.post(`${BASE_URL}/api/payment/webhook`, {
      data: {
        name: 'payment_intent.pending',
        id: 'evt_test_001',
        data: { object: {} },
      },
    });

    expect(res.status()).toBe(200);
    const body = await res.json() as { ok: boolean };
    expect(body.ok).toBe(true);

    console.log('TC-057a evidence:', JSON.stringify({
      event: 'payment_intent.pending',
      status: res.status(),
      ok: body.ok,
    }, null, 2));
  });

  test('TC-057b webhook returns ok:true for payment_intent.succeeded with missing metadata (no crash)', async ({ request }) => {
    // Sends a succeeded event but with no class_id/mobile in metadata.
    // The webhook handler logs a warning and skips purchase creation — must not 500.
    const res = await request.post(`${BASE_URL}/api/payment/webhook`, {
      data: {
        name: 'payment_intent.succeeded',
        id: 'evt_test_002',
        data: {
          object: {
            id: 'pi_test_002',
            amount: 1200,
            currency: 'HKD',
            metadata: {},
          },
        },
      },
    });

    expect(res.status()).toBe(200);
    const body = await res.json() as { ok: boolean };
    expect(body.ok).toBe(true);

    console.log('TC-057b evidence:', JSON.stringify({
      event: 'payment_intent.succeeded',
      metadata: 'empty — no class_id/mobile',
      status: res.status(),
      ok: body.ok,
    }, null, 2));
  });
});
