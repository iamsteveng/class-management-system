import { test, expect } from "@playwright/test";

// TC-035 tests the ingestion page which is on the feature branch (not yet deployed to production).
// Run against local dev server: npm run dev
const BASE_URL = "http://localhost:3000";

test("TC-035: Admin ingestion page renders without Poll Now for regular_admin", async ({
  page,
}) => {
  // Log in as regular_admin (staff/staff123)
  await page.goto(`${BASE_URL}/admin/login`);
  await page.fill('input[name="username"]', "staff");
  await page.fill('input[name="password"]', "staff123");
  await page.click('button[type="submit"]');
  // Wait for redirect away from login page
  await page.waitForURL(/\/admin\/(?!login)/, { timeout: 10000 });

  // Navigate to ingestion page
  await page.goto(`${BASE_URL}/admin/ingestion`);
  await page.waitForLoadState("networkidle");

  // Assert page loaded — heading must be visible
  const heading = page.getByRole("heading", { name: "S3 Ingestion" });
  await expect(heading).toBeVisible();

  // Page shows either the failed sends table or its empty state message
  const tableOrEmpty = page.locator(
    "table, p:has-text('No failed WhatsApp sends.')"
  );
  await expect(tableOrEmpty.first()).toBeVisible();

  // Assert Poll Now button is NOT in the DOM
  const pollNowButton = page.getByRole("button", { name: "Poll Now" });
  await expect(pollNowButton).toHaveCount(0);

  // Take screenshot as evidence
  await page.screenshot({ path: "tc-035-evidence.png", fullPage: true });
});
