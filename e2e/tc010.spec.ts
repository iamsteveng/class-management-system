import { test, expect } from '@playwright/test';

// Deployed Convex instance with updated testPurchase functions
const CONVEX_URL = 'https://colorless-raven-523.convex.cloud';

async function convexMutation(path: string, args: Record<string, unknown>) {
  const res = await fetch(`${CONVEX_URL}/api/mutation`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ path, args, format: 'json' }),
  });
  const json = await res.json() as { status: string; value?: unknown; errorMessage?: string };
  if (json.status !== 'success') throw new Error(`Mutation ${path} failed: ${json.errorMessage}`);
  return json.value;
}

async function convexQuery(path: string, args: Record<string, unknown>) {
  const res = await fetch(`${CONVEX_URL}/api/query`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ path, args, format: 'json' }),
  });
  const json = await res.json() as { status: string; value?: unknown; errorMessage?: string };
  if (json.status !== 'success') throw new Error(`Query ${path} failed: ${json.errorMessage}`);
  return json.value;
}

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

test('TC-010: Participant records created after terms (participant_count=3)', async () => {
  // Step 1: Create a test purchase with participant_count=3
  const result = await convexMutation('testPurchase:createTestPurchase', {
    customer_mobile: '+6599010010',
    participant_count: 3,
  }) as { token: string; purchase_id: string };
  const token = result.token;

  // Step 2: Accept terms via direct mutation (integration-level, no UI needed)
  // First get an available session
  const termsData = await convexQuery('terms:getTermsPageData', { token }) as {
    sessions: Array<{ session_id: string }>;
  } | null;

  expect(termsData, 'Terms page data must be available').not.toBeNull();
  expect(termsData!.sessions.length, 'At least one session must be available').toBeGreaterThan(0);

  const sessionId = termsData!.sessions[0].session_id;

  const acceptResult = await convexMutation('terms:acceptTermsByToken', {
    token,
    session_id: sessionId,
    accepted: true,
  }) as { success: boolean; error_message?: string };

  expect(acceptResult.success, `acceptTermsByToken failed: ${acceptResult.error_message}`).toBe(true);

  // Step 3: Query participants table and validate
  const participants = await convexQuery('testPurchase:getParticipantsByToken', { token }) as Array<{
    participant_id: string;
    session_id: string;
    terms_accepted_at?: number;
  }>;

  // Validate: 3 participant records created with unique participant_ids
  expect(participants.length, `Expected 3 participants, got ${participants.length}`).toBe(3);

  const ids = participants.map(p => p.participant_id);
  for (const id of ids) {
    expect(id, `participant_id '${id}' must be a valid UUID`).toMatch(UUID_REGEX);
  }
  const uniqueIds = new Set(ids);
  expect(uniqueIds.size, 'All participant_ids must be unique').toBe(3);

  // Evidence output
  console.log('DB Evidence:', JSON.stringify({
    row_count: participants.length,
    participants: participants.map(p => ({
      participant_id: p.participant_id,
      is_uuid: UUID_REGEX.test(p.participant_id),
      session_id: p.session_id,
    })),
  }, null, 2));
});
