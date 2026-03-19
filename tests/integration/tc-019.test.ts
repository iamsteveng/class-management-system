import { test, expect } from '@playwright/test';
import path from 'path';

const CONVEX_URL = 'https://colorless-raven-523.convex.cloud';
const BASE_URL = 'https://class-management-system-teal.vercel.app';

async function convexMutation(fnPath: string, args: Record<string, unknown>) {
  const res = await fetch(`${CONVEX_URL}/api/mutation`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ path: fnPath, args, format: 'json' }),
  });
  const json = await res.json() as { status: string; value?: unknown; errorMessage?: string };
  if (json.status !== 'success') throw new Error(`Mutation ${fnPath} failed: ${json.errorMessage}`);
  return json.value;
}

async function convexQuery(fnPath: string, args: Record<string, unknown>) {
  const res = await fetch(`${CONVEX_URL}/api/query`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ path: fnPath, args, format: 'json' }),
  });
  const json = await res.json() as { status: string; value?: unknown; errorMessage?: string };
  if (json.status !== 'success') throw new Error(`Query ${fnPath} failed: ${json.errorMessage}`);
  return json.value;
}

test.describe('TC-019: Change Session sends WhatsApp notification', () => {
  test('TC-019 changing a participant session triggers WhatsApp notification and audit log', async ({ page }) => {
    const testId = Date.now();
    const screenshotDir = path.join(process.cwd(), 'test-results');

    // Step 1: Create a test class
    const createdClass = await convexMutation('adminClasses:createClass', {
      name: `TC019 WA Notify Class ${testId}`,
      description: 'Change session WhatsApp notification test',
      admin_username: 'admin',
    }) as { class_id: string };
    console.log(`TC-019 created class: ${createdClass.class_id}`);

    // Step 2: Create session 1 (>2 days away — participant starts here)
    const session1 = await convexMutation('adminSessions:createSession', {
      class_id: createdClass.class_id,
      location: `TC019 Studio A ${testId}`,
      date: '2030-06-15',
      time: '10:00',
      quota_defined: 10,
      admin_username: 'admin',
    }) as { session_id: string };
    console.log(`TC-019 created session 1: ${session1.session_id}`);

    // Step 3: Create session 2 (target session — also >2 days away, same class)
    const session2 = await convexMutation('adminSessions:createSession', {
      class_id: createdClass.class_id,
      location: `TC019 Studio B ${testId}`,
      date: '2030-06-22',
      time: '10:00',
      quota_defined: 10,
      admin_username: 'admin',
    }) as { session_id: string };
    console.log(`TC-019 created session 2: ${session2.session_id}`);

    // Step 4: Create a test participant enrolled in session 1
    const participant = await convexMutation('testPurchase:createTestParticipant', {
      session_id: session1.session_id,
      name: `TC019 Participant ${testId}`,
      mobile: '+6599019019',
    }) as { participant_id: string };
    console.log(`TC-019 created participant: ${participant.participant_id}`);

    // Step 5: Log in as super_admin
    await page.goto(`${BASE_URL}/admin/login`);
    await page.getByLabel('Username').fill('admin');
    await page.getByLabel('Password').fill('admin123');
    await page.getByRole('button', { name: 'Sign In' }).click();
    await page.waitForURL(/\/admin\/dashboard/, { timeout: 20_000 });

    // Step 6: Navigate to participant admin detail page
    await page.goto(`${BASE_URL}/admin/participants/${participant.participant_id}`);
    await page.waitForLoadState('networkidle', { timeout: 20_000 });

    // Screenshot: participant detail page before change
    await page.screenshot({ path: path.join(screenshotDir, 'tc-019-participant-before.png'), fullPage: true });

    // Step 7: Click "Change Session" button to open the modal
    const changeSessionBtn = page.getByRole('button', { name: 'Change Session' });
    await expect(changeSessionBtn).toBeVisible({ timeout: 10_000 });
    await changeSessionBtn.click();

    // Step 8: Verify modal is open and select the new session (session 2)
    await expect(page.locator('text=A WhatsApp notification will be sent.')).toBeVisible({ timeout: 10_000 });
    const sessionRadio = page.locator(`input[type="radio"][value="${session2.session_id}"]`);
    await expect(sessionRadio).toBeVisible({ timeout: 10_000 });
    await sessionRadio.click();

    // Screenshot: modal with session selected
    await page.screenshot({ path: path.join(screenshotDir, 'tc-019-modal-session-selected.png'), fullPage: true });

    // Step 9: Confirm the change
    await page.getByRole('button', { name: 'Confirm Change' }).click();

    // Step 10: Wait for redirect with success status
    await page.waitForURL(/status=session_changed/, { timeout: 20_000 });

    // Screenshot: success confirmation
    await page.screenshot({ path: path.join(screenshotDir, 'tc-019-session-changed-success.png'), fullPage: true });

    // Step 11: Verify "Session changed successfully." banner
    const successBanner = page.locator('text=Session changed successfully.');
    await expect(successBanner).toBeVisible({ timeout: 10_000 });
    console.log('TC-019 session change confirmed on UI');

    // Step 12: Check audit log for participant_session_changed entry
    const auditLog = await convexQuery('testPurchase:getLatestAuditLogForEntity', {
      entity_type: 'participant',
      entity_id: participant.participant_id,
    }) as { action: string; entity_type: string; entity_id: string; created_at: number } | null;

    console.log('TC-019 audit log entry:', JSON.stringify(auditLog, null, 2));

    // Pass criterion 1: participants:changeParticipantSession was called (confirmed via audit log)
    expect(auditLog).not.toBeNull();
    expect(auditLog!.action).toBe('participant_session_changed');

    // Pass criterion 2: Audit log records a WhatsApp notification event
    // The UI states "A WhatsApp notification will be sent." but we check whether
    // the backend records a WhatsApp notification event in the audit log.
    // NOTE: As of current implementation, changeParticipantSession does NOT send
    // a WhatsApp notification — the audit log only contains 'participant_session_changed'.
    // This assertion verifies whether a WhatsApp notification event is recorded.
    const whatsappNotificationRecorded = auditLog!.action === 'whatsapp_notification_sent' ||
      auditLog!.action === 'participant_session_changed_notification_sent';

    console.log('TC-019 evidence:', JSON.stringify({
      participant_id: participant.participant_id,
      session_1_id: session1.session_id,
      session_2_id: session2.session_id,
      audit_log_action: auditLog?.action ?? 'NOT_FOUND',
      session_change_recorded: auditLog?.action === 'participant_session_changed',
      whatsapp_notification_recorded: whatsappNotificationRecorded,
      ui_success_banner_shown: true,
    }, null, 2));

    // This assertion tests whether WhatsApp notification is actually recorded
    expect(
      whatsappNotificationRecorded,
      'Expected a WhatsApp notification event in audit log after session change, but none was recorded. ' +
      `The UI states "A WhatsApp notification will be sent." but the backend changeParticipantSession ` +
      `mutation only records action="${auditLog?.action}" — no WhatsApp notification is sent.`
    ).toBe(true);
  });
});
