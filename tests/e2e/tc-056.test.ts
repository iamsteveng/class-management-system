import { test, expect } from '@playwright/test';

// TC-056: POST /api/payment/confirm returns 400 when required fields are missing.
// Does not exercise Convex or Airwallex — validates the input guard only.
const BASE_URL = 'http://localhost:3000';

test.describe('TC-056: /api/payment/confirm validates required fields', () => {
  test('TC-056 POST /api/payment/confirm with empty body returns 400', async ({ request }) => {
    const res = await request.post(`${BASE_URL}/api/payment/confirm`, {
      data: {},
    });

    expect(res.status()).toBe(400);
    const body = await res.json() as { error: string };
    expect(body.error).toBe('intent_id, class_id, and mobile are required');

    console.log('TC-056 evidence:', JSON.stringify({
      status: res.status(),
      error: body.error,
    }, null, 2));
  });

  test('TC-056b POST /api/payment/confirm with partial fields returns 400', async ({ request }) => {
    const res = await request.post(`${BASE_URL}/api/payment/confirm`, {
      data: { intent_id: 'pi_test', class_id: 'some-id' },
    });

    expect(res.status()).toBe(400);
    const body = await res.json() as { error: string };
    expect(body.error).toBe('intent_id, class_id, and mobile are required');
  });
});
