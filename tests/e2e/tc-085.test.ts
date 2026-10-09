import { test, expect } from '@playwright/test';

// TC-085: Admin and test functions can't be called directly (ADR 0003). Naming an admin
// is no longer enough; functions only Convex itself uses aren't public at all.

const CONVEX_URL = 'https://graceful-mole-393.convex.cloud';

async function call(kind: 'query' | 'mutation' | 'action', path: string, args: Record<string, unknown>) {
  const res = await fetch(`${CONVEX_URL}/api/${kind}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ path, args, format: 'json' }),
  });
  return (await res.json()) as { status: string; errorMessage?: string };
}

test('TC-085 direct calls without the server secret are refused', async () => {
  // Server-only: refused without the secret, or with a guessed one
  const noSecret = await call('mutation', 'adminSessions:setSessionHidden', {
    session_id: 'x',
    hidden: true,
    admin_username: 'admin',
  });
  expect(noSecret.status).toBe('error');
  const guessed = await call('query', 'adminParticipants:getParticipantAdminDetails', {
    participant_id: 'x',
    server_secret: 'guess',
  });
  expect(guessed.status).toBe('error');
  expect(guessed.errorMessage).toContain('Not allowed');
  const testHelper = await call('mutation', 'testPurchase:createTestPurchase', {
    customer_mobile: '+85291085085',
    server_secret: 'guess',
  });
  expect(testHelper.errorMessage).toContain('Not allowed');

  // Internal: not callable from outside at all
  for (const [kind, path, args] of [
    ['query', 'adminAuth:getAdminByUsername', { username: 'admin' }],
    ['mutation', 'purchases:createPurchase', {}],
    ['action', 'slackNotifications:notifyTermsAccepted', {}],
  ] as const) {
    const res = await call(kind, path, args);
    expect(res.status, path).toBe('error');
    expect(res.errorMessage, path).toMatch(/Could not find public function/);
  }

  // Public functions for Customers and Participants still work
  const landing = await call('query', 'landing:getLandingData', {});
  expect(landing.status).toBe('success');
});
