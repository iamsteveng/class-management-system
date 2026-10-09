import { test, expect } from '@playwright/test';
import { withServerSecret } from './helpers/serverSecret';

// TC-080: Paid checkout. Starting a checkout holds the seats and creates an Airwallex
// payment intent for exactly the held amount; held seats count as taken until released.

const CONVEX_URL = 'https://graceful-mole-393.convex.cloud';
const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

async function convex(kind: 'mutation' | 'query', fnPath: string, args: Record<string, unknown>) {
  const res = await fetch(`${CONVEX_URL}/api/${kind}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ path: fnPath, args: withServerSecret(fnPath, args), format: 'json' }),
  });
  const json = (await res.json()) as { status: string; value?: unknown; errorMessage?: string };
  if (json.status !== 'success') throw new Error(`${fnPath} failed: ${json.errorMessage}`);
  return json.value;
}

const person = (name: string) => ({
  name,
  age: 30,
  height: 170,
  riding_experience: 'never',
  mobile: '+85291080080',
  emergency_contact_name: 'Contact',
  emergency_contact_phone: '+85298080080',
  photo_consent: false,
});

test.describe('TC-080: Seat Hold during paid checkout', () => {
  test('TC-080 holds seats at the Group Price and releases them', async ({ request }) => {
    const testId = Date.now();
    const { class_id: classId } = (await convex('mutation', 'adminClasses:createClass', {
      name_zh: `TC080 Class ${testId}`,
      airwallex_price: 180,
      airwallex_group_price: 150,
      airwallex_group_min_qty: 2,
      airwallex_currency: 'HKD',
      admin_username: 'admin',
    })) as { class_id: string };
    const { session_id: sessionId } = (await convex('mutation', 'adminSessions:createSession', {
      class_id: classId,
      location_zh: `TC080 Venue ${testId}`,
      date: '2030-11-01',
      time: '10:00',
      quota_defined: 3,
      admin_username: 'admin',
    })) as { session_id: string };
    const remaining = async () =>
      (
        (await convex('query', 'applyPage:getApplyPageData', { class_id: classId })) as {
          sessions: Array<{ session_id: string; remaining_quota: number }>;
        }
      ).sessions.find((s) => s.session_id === sessionId)?.remaining_quota;

    try {
      const start = await request.post(`${BASE_URL}/api/checkout/start`, {
        data: {
          request_id: crypto.randomUUID(),
          class_id: classId,
          session_id: sessionId,
          customer_mobile: '+85291080080',
          participants: [person('A'), person('B')],
          terms_accepted: true,
        },
      });
      expect(start.status()).toBe(200);
      const hold = await start.json();
      expect(hold).toMatchObject({ kind: 'held', amount: 300, currency: 'HKD' });
      expect(hold.intent_id).toMatch(/^int_/);
      expect(hold.client_secret).toBeTruthy();
      expect(await remaining()).toBe(1);

      // Two more people don't fit while the hold is live
      const second = await request.post(`${BASE_URL}/api/checkout/start`, {
        data: {
          request_id: crypto.randomUUID(),
          class_id: classId,
          session_id: sessionId,
          customer_mobile: '+85261080080',
          participants: [person('C'), person('D')],
          terms_accepted: true,
        },
      });
      expect(second.status()).toBe(409);

      // Completing without paying does not seat anyone
      const early = await request.post(`${BASE_URL}/api/checkout/complete`, {
        data: { hold_id: hold.hold_id, intent_id: hold.intent_id },
      });
      expect((await early.json()).outcome).toBe('not_paid');

      const released = await request.post(`${BASE_URL}/api/checkout/release`, { data: { hold_id: hold.hold_id } });
      expect(released.status()).toBe(200);
      expect(await remaining()).toBe(3);
    } finally {
      await convex('mutation', 'adminClasses:setClassStatus', {
        class_id: classId,
        status: 'inactive',
        admin_username: 'admin',
      });
    }
  });

  test('TC-080 the checkout functions refuse direct calls without the server secret', async () => {
    const res = await fetch(`${CONVEX_URL}/api/mutation`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        path: 'checkout:completeCheckout',
        args: { server_secret: 'guess', hold_id: 'x', intent_id: 'y', amount: 0, currency: 'HKD' },
        format: 'json',
      }),
    });
    const json = (await res.json()) as { status: string; errorMessage?: string };
    expect(json.status).toBe('error');
    expect(json.errorMessage).toContain('Not allowed');
  });
});
