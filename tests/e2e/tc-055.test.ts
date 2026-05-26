import { test, expect } from '@playwright/test';

// TC-055: POST /api/payment/create-intent returns 400 when required fields are missing.
// Does not require Airwallex credentials — validates input guard only.
const BASE_URL = 'http://localhost:3000';

test.describe('TC-055: /api/payment/create-intent validates required fields', () => {
  test('TC-055 POST /api/payment/create-intent with missing body returns 400', async ({ request }) => {
    const res = await request.post(`${BASE_URL}/api/payment/create-intent`, {
      data: {},
    });

    expect(res.status()).toBe(400);
    const body = await res.json() as { error: string };
    expect(body.error).toBe('class_id and mobile are required');

    console.log('TC-055 evidence:', JSON.stringify({
      status: res.status(),
      error: body.error,
    }, null, 2));
  });

  test('TC-055b POST /api/payment/create-intent with only class_id returns 400', async ({ request }) => {
    const res = await request.post(`${BASE_URL}/api/payment/create-intent`, {
      data: { class_id: 'some-id' },
    });

    expect(res.status()).toBe(400);
    const body = await res.json() as { error: string };
    expect(body.error).toBe('class_id and mobile are required');
  });
});
