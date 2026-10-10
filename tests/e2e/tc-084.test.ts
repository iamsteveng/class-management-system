import { test, expect, type Page } from '@playwright/test';
import { withServerSecret } from './helpers/serverSecret';

// TC-084: Nothing from before the revamp breaks.
// - A Participant from a Legacy Ticket and one from the new apply flow both mark
//   attendance at the door, whether staff enter the bare ID (old QRs) or the Participant
//   Link (new QRs).
// - A new-flow Participant can change Session themselves, but never into a Hidden Session
//   or out of a Session inside its Change Cutoff.
// - Hidden Sessions stay out of the new apply flow, and booking one directly is refused.
// (The Legacy Token terms page and self-service change are covered by TC-017; Hidden
// Sessions on the terms page by TC-078.)

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

async function login(page: Page) {
  await page.goto(`${BASE_URL}/admin/login`);
  await page.getByLabel('Username').fill('admin');
  await page.getByLabel('Password').fill('admin123');
  await page.getByRole('button', { name: 'Sign In' }).click();
  await page.waitForURL(/\/admin\/dashboard/, { timeout: 20_000 });
}

const person = {
  name: 'New Flow Person',
  age: 30,
  height: 170,
  riding_experience: 'never',
  mobile: '+85291084084',
  emergency_contact_name: 'Contact',
  emergency_contact_phone: '+85298084084',
  photo_consent: false,
};

test('TC-084 legacy and new Participants work at the door and when changing Session', async ({ page, request }) => {
  test.setTimeout(90_000);
  const testId = Date.now();
  const { class_id: classId } = (await convex('mutation', 'adminClasses:createClass', {
    name_zh: `TC084 Class ${testId}`,
    is_free: true,
    admin_username: 'admin',
  })) as { class_id: string };
  const session = async (date: string, location: string, time = '10:00') =>
    (
      (await convex('mutation', 'adminSessions:createSession', {
        class_id: classId,
        location_zh: `${location} ${testId}`,
        date,
        time,
        quota_defined: 5,
        admin_username: 'admin',
      })) as { session_id: string }
    ).session_id;
  // Today in Hong Kong, late enough that it has not started: attendance can be marked today
  const today = new Date(Date.now() + 8 * 3_600_000).toISOString().slice(0, 10);
  const sessionA = await session(today, 'TC084 Today', '23:59');
  const sessionB = await session('2030-11-02', 'TC084 Hidden');
  const sessionC = await session('2030-11-03', 'TC084 Later');
  const sessionD = await session('2030-11-04', 'TC084 Later Still');
  await convex('mutation', 'adminSessions:setSessionHidden', {
    session_id: sessionB,
    hidden: true,
    admin_username: 'admin',
  });

  try {
    // Hidden Sessions are not offered by the new apply flow, and can't be booked directly
    const applyData = (await convex('query', 'applyPage:getApplyPageData', { class_id: classId })) as {
      sessions: Array<{ session_id: string }>;
    };
    expect(applyData.sessions.map((s) => s.session_id)).not.toContain(sessionB);
    expect(applyData.sessions.map((s) => s.session_id)).toContain(sessionC);
    await page.goto(`${BASE_URL}/apply/${classId}`);
    await expect(page.locator(`[data-session-id="${sessionC}"]`)).toBeVisible();
    await expect(page.locator(`[data-session-id="${sessionB}"]`)).toHaveCount(0);
    const hiddenBooking = await request.post(`${BASE_URL}/api/checkout/start`, {
      data: {
        request_id: crypto.randomUUID(),
        class_id: classId,
        session_id: sessionB,
        customer_mobile: '+85291084084',
        participants: [person],
        terms_accepted: true,
      },
    });
    expect((await hiddenBooking.json()).code).toBe('session');

    // One Participant from a Legacy Ticket, one from the new apply flow, both in today's Session
    const legacy = (await convex('mutation', 'testPurchase:createTestParticipant', {
      session_id: sessionA,
      name: 'Legacy Person',
      mobile: '+85291084000',
    })) as { participant_id: string };
    const book = async (sessionId: string, name: string) => {
      const res = await request.post(`${BASE_URL}/api/checkout/start`, {
        data: {
          request_id: crypto.randomUUID(),
          class_id: classId,
          session_id: sessionId,
          customer_mobile: '+85291084084',
          participants: [{ ...person, name }],
          terms_accepted: true,
        },
      });
      const { hold_id: holdId } = await res.json();
      const result = (await convex('query', 'checkout:getCheckoutResult', { hold_id: holdId })) as {
        participants: Array<{ participant_id: string }>;
      };
      return result.participants[0].participant_id;
    };
    const newId = await book(sessionA, 'New Flow Person');

    // A new-flow Participant changes Session themselves, but never into a Hidden Session
    const mover = await book(sessionC, 'Mover');
    const toHidden = (await convex('mutation', 'participants:changeParticipantSession', {
      participant_id: mover,
      session_id: sessionB,
    })) as { success: boolean };
    expect(toHidden.success).toBe(false);
    const toD = (await convex('mutation', 'participants:changeParticipantSession', {
      participant_id: mover,
      session_id: sessionD,
    })) as { success: boolean };
    expect(toD.success).toBe(true);
    // Inside today's Change Cutoff, a Participant can't move themselves out
    const outOfToday = (await convex('mutation', 'participants:changeParticipantSession', {
      participant_id: newId,
      session_id: sessionD,
    })) as { success: boolean };
    expect(outOfToday.success).toBe(false);

    // At the door: the old QR held the bare ID, the new one holds the Participant Link
    await login(page);
    await page.goto(`${BASE_URL}/admin/sessions/${sessionA}/participants`);
    const manual = page.getByPlaceholder('Paste participant ID or link');

    await manual.fill(legacy.participant_id);
    await page.getByRole('button', { name: 'Mark' }).click();
    await expect(page.getByRole('status')).toContainText('Legacy Person marked as attended');

    await manual.fill(`${BASE_URL}/participant/${newId}`);
    await page.getByRole('button', { name: 'Mark' }).click();
    await expect(page.getByRole('status')).toContainText('New Flow Person marked as attended');

    await expect(page.locator('tr', { hasText: 'Legacy Person' })).toContainText('Attended');
    await expect(page.locator('tr', { hasText: 'New Flow Person' })).toContainText('Attended');
  } finally {
    await convex('mutation', 'adminClasses:setClassStatus', {
      class_id: classId,
      status: 'inactive',
      admin_username: 'admin',
    });
  }
});
