import { expect, test } from "@playwright/test";

import { convexMutation, convexQuery, seedInitialData } from "./qa-utils";

type SessionRow = {
  session_id: string;
  location: string;
  date: string;
  time: string;
  quota_defined: number;
  quota_used: number;
  quota_available: number;
  status: "scheduled" | "completed" | "cancelled";
};

type SessionManagementPageData = {
  class_id: string;
  class_name: string;
  sessions: SessionRow[];
} | null;

function getFutureDate(daysAhead: number) {
  const date = new Date();
  date.setDate(date.getDate() + daysAhead);
  return date.toISOString().slice(0, 10);
}

test("BUG-TC-005: Super admin can edit session details from class session list", async ({
  page,
}) => {
  await seedInitialData();

  const createdClass = await convexMutation<{ class_id: string }>(
    "adminClasses:createClass",
    {
      name: `TC005 Class ${Date.now()}`,
      description: "Session edit class",
      admin_username: "admin",
    }
  );

  const createdSession = await convexMutation<{ session_id: string }>(
    "adminSessions:createSession",
    {
      class_id: createdClass.class_id,
      location: "TC005 Original Location",
      date: getFutureDate(12),
      time: "09:30",
      quota_defined: 25,
      admin_username: "admin",
    }
  );

  await page.goto("/admin/login");
  await page.getByLabel("Username").fill("admin");
  await page.getByLabel("Password").fill("admin123");
  await page.getByRole("button", { name: "Sign In" }).click();
  await page.waitForURL(/\/admin\/dashboard/, { timeout: 20_000 });

  await page.goto(`/admin/classes/${createdClass.class_id}/sessions`);

  const sessionRow = page.locator("tbody tr").filter({
    hasText: "TC005 Original Location",
  });
  await expect(sessionRow).toHaveCount(1);
  await sessionRow.getByRole("button", { name: "Edit" }).click();

  await expect(page.getByRole("heading", { name: "Edit Session" })).toBeVisible();
  await expect(
    page.locator(`input[name="session_id"][value="${createdSession.session_id}"]`)
  ).toHaveCount(1);
  await expect(page.locator('input[name="location"]')).toHaveValue(
    "TC005 Original Location"
  );
  await expect(page.locator('input[name="date"]')).toHaveValue(getFutureDate(12));
  await expect(page.locator('input[name="time"]')).toHaveValue("09:30");
  await expect(page.locator('input[name="quota_defined"]')).toHaveValue("25");

  const updatedLocation = "TC005 Updated Location";
  const updatedDate = getFutureDate(20);
  const updatedTime = "15:45";
  const updatedQuota = "32";

  await page.locator('input[name="location"]').fill(updatedLocation);
  await page.locator('input[name="date"]').fill(updatedDate);
  await page.locator('input[name="time"]').fill(updatedTime);
  await page.locator('input[name="quota_defined"]').fill(updatedQuota);
  await page.getByRole("button", { name: "Save" }).click();

  await page.waitForURL(
    new RegExp(`/admin/classes/${createdClass.class_id}/sessions\\?status=session_updated`),
    { timeout: 20_000 }
  );
  await expect(page.getByText("Session updated successfully.")).toBeVisible();
  const updatedRow = page.locator("tbody tr").filter({ hasText: updatedLocation });
  await expect(updatedRow).toHaveCount(1);
  await expect(updatedRow.getByText(updatedDate)).toBeVisible();
  await expect(updatedRow.getByText(updatedTime)).toBeVisible();
  await expect(updatedRow.getByText("32 / 0 /")).toBeVisible();

  const updatedPageData = await convexQuery<SessionManagementPageData>(
    "adminSessions:getSessionManagementPageData",
    { class_id: createdClass.class_id }
  );
  const updatedSession = updatedPageData?.sessions.find(
    (session) => session.session_id === createdSession.session_id
  );
  expect(updatedSession?.location).toBe(updatedLocation);
  expect(updatedSession?.date).toBe(updatedDate);
  expect(updatedSession?.time).toBe(updatedTime);
  expect(updatedSession?.quota_defined).toBe(32);

  await page.screenshot({ path: "e2e/tc005-session-edit-screenshot.png", fullPage: true });
});
