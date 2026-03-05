import { expect, test } from "@playwright/test";

import { convexMutation, convexQuery, seedInitialData } from "./qa-utils";

type ClassRow = {
  class_id: string;
  class_name: string;
  description?: string;
  total_sessions: number;
  status: "active" | "inactive";
};

test("BUG-TC-005: Super admin can edit class details from classes list", async ({ page }) => {
  await seedInitialData();

  const baseName = `TC003 Class ${Date.now()}`;
  const created = await convexMutation<{ class_id: string }>("adminClasses:createClass", {
    name: baseName,
    description: "Original description",
    admin_username: "admin",
  });

  await page.goto("/admin/login");
  await page.getByLabel("Username").fill("admin");
  await page.getByLabel("Password").fill("admin123");
  await page.getByRole("button", { name: "Sign In" }).click();
  await page.waitForURL(/\/admin\/dashboard/, { timeout: 20_000 });

  await page.goto("/admin/classes");

  const classRow = page.locator("tbody tr").filter({ hasText: created.class_id });
  await expect(classRow).toHaveCount(1);
  await classRow.getByRole("button", { name: "Edit" }).click();

  const modal = page.getByRole("heading", { name: "Edit Class" });
  await expect(modal).toBeVisible();
  await expect(page.locator(`input[name="class_id"][value="${created.class_id}"]`)).toHaveCount(1);
  await expect(page.locator('input[name="name"]')).toHaveValue(baseName);
  await expect(page.locator('textarea[name="description"]')).toHaveValue("Original description");

  const updatedName = `${baseName} Updated`;
  const updatedDescription = "Updated description";

  await page.locator('input[name="name"]').fill(updatedName);
  await page.locator('textarea[name="description"]').fill(updatedDescription);
  await page.getByRole("button", { name: "Save" }).click();

  await page.waitForURL(/\/admin\/classes\?status=class_updated/, { timeout: 20_000 });
  await expect(page.getByText("Class updated successfully.")).toBeVisible();
  await expect(page.getByRole("link", { name: updatedName })).toBeVisible();

  const classes = await convexQuery<ClassRow[]>("adminClasses:getClassListPageData", {});
  const updated = classes.find((cls) => cls.class_id === created.class_id);
  expect(updated?.class_name).toBe(updatedName);
  expect(updated?.description ?? "").toBe(updatedDescription);

  await page.screenshot({ path: "e2e/tc003-class-edit-screenshot.png", fullPage: true });
});
