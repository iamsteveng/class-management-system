import type { Page } from '@playwright/test';
import { withServerSecret } from './serverSecret';

// Shared setup for apply-flow tests: a throwaway Class with one Session on Convex dev.

export const CONVEX_URL = 'https://graceful-mole-393.convex.cloud';
export const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

export async function convex(kind: 'mutation' | 'query', fnPath: string, args: Record<string, unknown>) {
  const res = await fetch(`${CONVEX_URL}/api/${kind}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ path: fnPath, args: withServerSecret(fnPath, args), format: 'json' }),
  });
  const json = (await res.json()) as { status: string; value?: unknown; errorMessage?: string };
  if (json.status !== 'success') throw new Error(`${fnPath} failed: ${json.errorMessage}`);
  return json.value;
}

export type ApplyFixture = { classId: string; sessionId: string; cleanup: () => Promise<void> };

export async function createApplyFixture(
  name: string,
  cls: Record<string, unknown>,
  quota = 5
): Promise<ApplyFixture> {
  const { class_id: classId } = (await convex('mutation', 'adminClasses:createClass', {
    name_zh: name,
    admin_username: 'admin',
    ...cls,
  })) as { class_id: string };
  const { session_id: sessionId } = (await convex('mutation', 'adminSessions:createSession', {
    class_id: classId,
    location_zh: `${name} Venue`,
    date: '2030-11-01',
    time: '10:00',
    quota_defined: quota,
    admin_username: 'admin',
  })) as { session_id: string };
  return {
    classId,
    sessionId,
    cleanup: async () => {
      await convex('mutation', 'adminClasses:setClassStatus', {
        class_id: classId,
        status: 'inactive',
        admin_username: 'admin',
      });
    },
  };
}

/** Fills in valid details for every participant shown, and accepts the terms. */
export async function fillValidDetails(page: Page, people = 1) {
  await page.locator('input[name="customer_mobile"]').fill('+85291234567');
  for (let i = 0; i < people; i++) {
    await page.locator(`input[name="p${i}_name"]`).fill(`Person ${i + 1}`);
    await page.locator(`input[name="p${i}_age"]`).fill('30');
    await page.locator(`input[name="p${i}_height"]`).fill('170');
    if (i === 0) {
      await page.locator('input[name="p0_emergency_name"]').fill('Contact');
      await page.locator('input[name="p0_emergency_phone"]').fill('+85298765432');
    }
  }
  await page.locator('input[name="terms_accepted"]').check();
}

/** Stands in for the server's checkout start, so payment-method UI can be tested without Airwallex. */
export async function mockCheckoutStart(page: Page) {
  await page.route('**/api/checkout/start', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        kind: 'held',
        hold_id: 'hold-test',
        intent_id: 'int_test',
        client_secret: 'secret',
        amount: 500,
        currency: 'HKD',
        expires_at: Date.now() + 15 * 60_000,
      }),
    })
  );
}

/** Fills Airwallex's three card fields with the demo test card (succeeds without 3DS). */
export async function fillTestCard(page: Page, card = process.env.AIRWALLEX_TEST_CARD || '4035501000000008') {
  const field = (id: string) => page.frameLocator(`#${id} iframe`).locator('input');
  await field('apply-card-number').waitFor({ timeout: 30_000 });
  await field('apply-card-number').fill(card);
  await field('apply-card-expiry').fill('12/30');
  await field('apply-card-cvc').fill('123');
}
