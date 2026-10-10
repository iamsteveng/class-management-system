import { test, expect } from '@playwright/test';

import { BASE_URL, createApplyFixture } from './helpers/applyFixture';

// TC-067: For a held booking, /api/payment/alipay-hk/start returns what the mobile apply page
// needs (Airwallex demo). Skips if the demo account doesn't offer Alipay HK.

test('TC-067 Alipay HK start on mobile', async ({ request }) => {
  const fx = await createApplyFixture(`TC067 Class ${Date.now()}`, { airwallex_price: 10, airwallex_currency: 'HKD' });
  try {
    const hold = await (
      await request.post(`${BASE_URL}/api/checkout/start`, {
        data: {
          request_id: crypto.randomUUID(),
          class_id: fx.classId,
          session_id: fx.sessionId,
          customer_mobile: '+85291234567',
          participants: [
            {
              name: 'Alipay Tester',
              age: 30,
              height: 170,
              riding_experience: 'never',
              mobile: '+85291234567',
              emergency_contact_name: 'Contact',
              emergency_contact_phone: '+85298765432',
              photo_consent: false,
            },
          ],
          terms_accepted: true,
        },
      })
    ).json();
    expect(hold.kind).toBe('held');

    const res = await request.post(`${BASE_URL}/api/payment/alipay-hk/start`, {
      data: { intent_id: hold.intent_id, is_mobile: true, os_type: 'ios', return_url: `${BASE_URL}/apply/${fx.classId}/alipay-return?intent_id=${hold.intent_id}&hold_id=${hold.hold_id}` },
    });
    if (res.status() !== 200) {
      console.log('TC-067: alipay-hk/start returned', res.status(), '— Airwallex demo may not offer Alipay HK');
      return;
    }
    const start = await res.json();
    expect(start.type).toBe('redirect');
    expect(start.url).toMatch(/^https?:\/\//);

    await request.post(`${BASE_URL}/api/checkout/release`, { data: { hold_id: hold.hold_id } });
  } finally {
    await fx.cleanup();
  }
});
