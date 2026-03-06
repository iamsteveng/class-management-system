import { expect, test } from "@playwright/test";

import { convexMutation, convexQuery, seedInitialData } from "./qa-utils";

type ClassRow = {
  class_id: string;
  class_name: string;
  status: "active" | "inactive";
};

function getFutureDate(daysAhead: number) {
  const date = new Date();
  date.setDate(date.getDate() + daysAhead);
  return date.toISOString().slice(0, 10);
}

test("BUG-TC-006: Super admin can cancel class only when no active future sessions", async ({
  page,
}) => {
  await seedInitialData();

  const blockedClass = await convexMutation<{ class_id: string }>(
    "adminClasses:createClass",
    {
      name: `TC004 Blocked ${Date.now()}`,
      description: "Has future session",
      admin_username: "admin",
    }
  );

  await convexMutation<{ session_id: string }>("adminSessions:createSession", {
    class_id: blockedClass.class_id,
    location: "TC004 Future Location",
    date: getFutureDate(10),
    time: "10:00",
    quota_defined: 20,
    admin_username: "admin",
  });

  const cancellableClass = await convexMutation<{ class_id: string }>(
    "adminClasses:createClass",
    {
      name: `TC004 Cancellable ${Date.now()}`,
      description: "No future sessions",
      admin_username: "admin",
    }
  );

  await page.goto("/admin/login");
  await page.getByLabel("Username").fill("admin");
  await page.getByLabel("Password").fill("admin123");
  await page.getByRole("button", { name: "Sign In" }).click();
  await page.waitForURL(/\/admin\/dashboard/, { timeout: 20_000 });
  await page.goto("/admin/classes");

  const blockedRow = page.locator("tbody tr").filter({ hasText: blockedClass.class_id });
  await expect(blockedRow).toHaveCount(1);
  page.once("dialog", (dialog) => dialog.accept());
  await blockedRow.getByRole("button", { name: "Cancel" }).click();
  await page.waitForURL(/\/admin\/classes\?error=/, { timeout: 20_000 });
  await expect(page.getByText(/Failed to cancel class/i)).toBeVisible();

  const afterBlocked = await convexQuery<ClassRow[]>("adminClasses:getClassListPageData", {});
  expect(
    afterBlocked.find((cls) => cls.class_id === blockedClass.class_id)?.status
  ).toBe("active");

  await page.goto("/admin/classes");
  const cancellableRow = page
    .locator("tbody tr")
    .filter({ hasText: cancellableClass.class_id });
  await expect(cancellableRow).toHaveCount(1);

  page.once("dialog", (dialog) => dialog.accept());
  await cancellableRow.getByRole("button", { name: "Cancel" }).click();
  await page.waitForURL(/\/admin\/classes\?status=class_cancelled/, { timeout: 20_000 });
  await expect(page.getByText("Class cancelled successfully.")).toBeVisible();
  await expect(cancellableRow.getByText("cancelled")).toBeVisible();
  await expect(cancellableRow.getByRole("button", { name: "Cancel" })).toHaveCount(0);

  const afterCancelled = await convexQuery<ClassRow[]>(
    "adminClasses:getClassListPageData",
    {}
  );
  expect(
    afterCancelled.find((cls) => cls.class_id === cancellableClass.class_id)?.status
  ).toBe("inactive");

  await page.screenshot({ path: "e2e/tc004-class-cancel-screenshot.png", fullPage: true });
});
