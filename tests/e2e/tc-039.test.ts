import { test, expect } from "@playwright/test";

// TC-039 tests the ingestion page which is on the feature branch (not yet deployed to production).
// Run against local dev server: npm run dev
const BASE_URL = "http://localhost:3000";

test("TC-039: Poll Now triggers immediate ingestion action", async ({
  page,
}) => {
  // Step 1: Login as super_admin
  await page.goto(`${BASE_URL}/admin/login`);
  await page.fill('input[name="username"]', "admin");
  await page.fill('input[name="password"]', "admin123");
  await page.click('button[type="submit"]');
  await page.waitForURL(/\/admin\/(?!login)/, { timeout: 15000 });

  // Step 2: Navigate to ingestion page
  await page.goto(`${BASE_URL}/admin/ingestion`);
  await page.waitForTimeout(3000);

  // Take screenshot before clicking Poll Now
  await page.screenshot({ path: "tc039-before.png", fullPage: true });

  // Scope to the ingestion runs table (second table — has Timestamp header)
  const runsTable = page.locator('table').nth(1);
  const rowsBefore = await runsTable.locator("tbody tr").count();
  let latestTimestampBefore = "";
  if (rowsBefore > 0) {
    latestTimestampBefore = await runsTable
      .locator("tbody tr:first-child td:first-child")
      .innerText();
  }
  console.log(`Rows before: ${rowsBefore}, latest: ${latestTimestampBefore}`);

  // Step 3: Click Poll Now button (visible to super_admin only)
  const pollButton = page.getByRole("button", { name: "Poll Now" });
  await expect(pollButton).toBeVisible();

  const clickTime = Date.now();
  await pollButton.click();

  // Wait for redirect back with status=polled (action completes before redirect)
  await page.waitForURL(/status=polled/, { timeout: 30000 });
  const elapsedMs = Date.now() - clickTime;
  console.log(`Poll Now completed in ${elapsedMs}ms`);

  // Ensure elapsed time is within 10 seconds
  expect(elapsedMs).toBeLessThan(10000);

  // Wait for page to fully render
  await page.waitForTimeout(2000);

  // Step 4: Assert new ingestion_runs record appears
  const rowsAfter = await runsTable.locator("tbody tr").count();

  let latestTimestampAfter = "";
  if (rowsAfter > 0) {
    latestTimestampAfter = await runsTable
      .locator("tbody tr:first-child td:first-child")
      .innerText();
  }

  console.log(`Rows after: ${rowsAfter}, latest: ${latestTimestampAfter}`);

  // New row should have appeared OR timestamp changed (new run at top)
  const newRunAppeared =
    rowsAfter > rowsBefore || latestTimestampAfter !== latestTimestampBefore;
  expect(newRunAppeared).toBe(true);

  // Take evidence screenshot
  await page.screenshot({ path: "tc039-evidence.png", fullPage: true });
});
