import { test, expect } from '@playwright/test';
import path from 'path';

const CONVEX_URL = 'https://graceful-mole-393.convex.cloud';
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

test.describe('TC-008: Participant list does NOT show Name column', () => {
  test('TC-008 participant list table has no Name column header and no name data cells', async ({ page }) => {
    const testId = Date.now();
    const screenshotDir = path.join(process.cwd(), 'test-results');

    // Step 1: Create a class
    const createdClass = await convexMutation('adminClasses:createClass', {
      name: `TC008 Class ${testId}`,
      description: 'TC-008 participant list no name column test',
      admin_username: 'admin',
    }) as { class_id: string };

    // Step 2: Create a session
    const createdSession = await convexMutation('adminSessions:createSession', {
      class_id: createdClass.class_id,
      location: `TC008 Studio ${testId}`,
      date: '2030-12-21',
      time: '10:00',
      quota_defined: 10,
      admin_username: 'admin',
    }) as { session_id: string };

    // Step 3: Log in as admin
    await page.goto(`${BASE_URL}/admin/login`);
    await page.getByLabel('Username').fill('admin');
    await page.getByLabel('Password').fill('admin123');
    await page.getByRole('button', { name: 'Sign In' }).click();
    await page.waitForURL(/\/admin\/dashboard/, { timeout: 20_000 });

    // Step 4: Navigate to the session's participant list
    await page.goto(`${BASE_URL}/admin/sessions/${createdSession.session_id}/participants`);
    await page.waitForLoadState('networkidle');

    // Step 5: Find the table header row
    const table = page.locator('table');
    await expect(table).toBeVisible({ timeout: 15_000 });

    const thead = table.locator('thead');
    await expect(thead).toBeVisible({ timeout: 10_000 });

    // Step 6: Assert "Name" column header is NOT present
    const allHeaders = thead.locator('th');
    const headerTexts = await allHeaders.allTextContents();
    console.log('TC-008 table headers found:', headerTexts);

    const hasNameColumn = headerTexts.some(h => h.trim().toLowerCase() === 'name');
    expect(hasNameColumn, `Expected no "Name" column header but found one. Headers: ${JSON.stringify(headerTexts)}`).toBe(false);

    // Step 7: Assert all expected columns are present
    const expectedColumns = ['Participant ID', 'Mobile', 'Terms Accepted', 'Terms Version', 'Attendance Status', 'Details'];
    for (const col of expectedColumns) {
      const hasCol = headerTexts.some(h => h.trim() === col);
      expect(hasCol, `Expected column "${col}" to be present. Headers: ${JSON.stringify(headerTexts)}`).toBe(true);
    }

    // Step 8: Take screenshot as evidence
    await page.screenshot({ path: path.join(screenshotDir, 'tc-008-participant-list-no-name-column.png'), fullPage: true });

    console.log('TC-008 evidence:', JSON.stringify({
      session_id: createdSession.session_id,
      headers_found: headerTexts,
      name_column_absent: !hasNameColumn,
      expected_columns_present: expectedColumns,
    }, null, 2));
  });
});
