import { test, expect } from '@playwright/test';

import { BASE_URL, convex, createApplyFixture } from './helpers/applyFixture';

// TC-074: The Airwallex webhook only seats an Order once Airwallex itself says the
// payment succeeded. A forged "succeeded" event for an unpaid booking seats nobody, and
// events without a Seat Hold are ignored.

const person = {
  name: 'Webhook Tester',
  age: 30,
  height: 170,
  riding_experience: 'never',
  mobile: '+85291074074',
  emergency_contact_name: 'Contact',
  emergency_contact_phone: '+85298074074',
  photo_consent: false,
};

test('TC-074 webhook verifies the payment with Airwallex before seating', async ({ request }) => {
  const fx = await createApplyFixture(`TC074 Class ${Date.now()}`, { airwallex_price: 10, airwallex_currency: 'HKD' });
  const remaining = async () =>
    (
      (await convex('query', 'applyPage:getApplyPageData', { class_id: fx.classId })) as {
        sessions: Array<{ session_id: string; remaining_quota: number }>;
      }
    ).sessions.find((s) => s.session_id === fx.sessionId)?.remaining_quota;

  try {
    const hold = await (
      await request.post(`${BASE_URL}/api/checkout/start`, {
        data: {
          request_id: crypto.randomUUID(),
          class_id: fx.classId,
          session_id: fx.sessionId,
          customer_mobile: '+85291074074',
          participants: [person],
          terms_accepted: true,
        },
      })
    ).json();
    expect(hold.kind).toBe('held');

    // A forged event claiming the (unpaid) intent succeeded
    const forged = await request.post(`${BASE_URL}/api/payment/webhook`, {
      data: {
        name: 'payment_intent.succeeded',
        id: 'evt_forged',
        data: { object: { id: hold.intent_id, amount: 10, currency: 'HKD', metadata: { hold_id: hold.hold_id } } },
      },
    });
    expect(forged.status()).toBe(200);
    const result = (await convex('query', 'checkout:getCheckoutResult', { hold_id: hold.hold_id })) as {
      status: string;
      participants: unknown[];
    };
    expect(result.status).toBe('held');
    expect(result.participants).toEqual([]);

    // An event with no Seat Hold is ignored
    const noHold = await request.post(`${BASE_URL}/api/payment/webhook`, {
      data: {
        name: 'payment_intent.succeeded',
        id: 'evt_old',
        data: { object: { id: 'int_old', amount: 10, currency: 'HKD', metadata: { class_id: fx.classId, mobile: '+85291074074' } } },
      },
    });
    expect(noHold.status()).toBe(200);

    await request.post(`${BASE_URL}/api/checkout/release`, { data: { hold_id: hold.hold_id } });
    expect(await remaining()).toBe(5);
  } finally {
    await fx.cleanup();
  }
});
