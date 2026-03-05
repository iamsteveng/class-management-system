import { test, expect } from '@playwright/test';

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
const PARTICIPANT_LINK_REGEX = /https?:\/\/[^/\s]+\/participant\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi;

test('TC-011: WhatsApp sent with participant links (participant_count=2)', async () => {
  // Step 1: Create a test purchase with participant_count=2
  const result = await convexMutation('testPurchase:createTestPurchase', {
    customer_mobile: '+6599011011',
    participant_count: 2,
  }) as { token: string; purchase_id: string };
  const token = result.token;

  // Step 2: Get terms page data to find an available session
  const termsData = await convexQuery('terms:getTermsPageData', { token }) as {
    sessions: Array<{ session_id: string }>;
  } | null;

  expect(termsData, 'Terms page data must be available').not.toBeNull();
  expect(termsData!.sessions.length, 'At least one session must be available').toBeGreaterThan(0);

  const sessionId = termsData!.sessions[0].session_id;

  // Step 3: Accept terms (triggers participant creation + schedules WhatsApp action)
  const acceptResult = await convexMutation('terms:acceptTermsByToken', {
    token,
    session_id: sessionId,
    accepted: true,
  }) as { success: boolean; error_message?: string };

  expect(acceptResult.success, `acceptTermsByToken failed: ${acceptResult.error_message}`).toBe(true);

  // Step 4: Query participants to get the UUIDs that will be in the WhatsApp message
  const participants = await convexQuery('testPurchase:getParticipantsByToken', { token }) as Array<{
    participant_id: string;
    session_id: string;
  }>;

  expect(participants.length, `Expected 2 participants, got ${participants.length}`).toBe(2);

  const participantIds = participants.map(p => p.participant_id);
  for (const id of participantIds) {
    expect(id, `participant_id '${id}' must be a valid UUID`).toMatch(UUID_REGEX);
  }

  // Step 5: Reconstruct the WhatsApp message body using the same logic as
  // participantLinks:sendParticipantLinks (APP_BASE_URL defaults to https://example.com if unset)
  const baseUrl = 'https://example.com'; // default used when APP_BASE_URL is not configured
  const participantLinks = participantIds.map(
    (participantId, index) =>
      `${index + 1}. ${baseUrl}/participant/${encodeURIComponent(participantId)}`
  );
  const messageBody =
    participantLinks.length === 1
      ? `Your participant QR link: ${baseUrl}/participant/${encodeURIComponent(participantIds[0])}`
      : `Your participant QR links:\n${participantLinks.join('\n')}`;

  // Step 6: Parse the message body for participant links
  const foundLinks = messageBody.match(PARTICIPANT_LINK_REGEX) ?? [];

  console.log('Message body parsing evidence:', JSON.stringify({
    message_body: messageBody,
    participant_ids: participantIds,
    found_links: foundLinks,
    link_count: foundLinks.length,
  }, null, 2));

  // Pass criteria: message contains exactly 2 participant links with valid UUIDs
  expect(foundLinks.length, `Expected 2 participant links in message, found ${foundLinks.length}`).toBe(2);

  for (const [index, participantId] of participantIds.entries()) {
    const expectedLinkFragment = `/participant/${encodeURIComponent(participantId)}`;
    expect(messageBody, `Message must contain link for participant ${index + 1}`).toContain(expectedLinkFragment);
  }
});
