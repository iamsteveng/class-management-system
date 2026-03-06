import { expect, test } from "@playwright/test";

import { convexMutation, seedInitialData } from "./qa-utils";

function getFutureDate(daysAhead: number) {
  const date = new Date();
  date.setDate(date.getDate() + daysAhead);
  return date.toISOString().slice(0, 10);
}

test("BUG-TC-007: Role-based visibility and mutation guards for class/session actions", async ({
  page,
}) => {
  await seedInitialData();

  const uniqueSuffix = Date.now();
  const className = `TC007 Role Class ${uniqueSuffix}`;
  const sessionLocation = `TC007 Role Location ${uniqueSuffix}`;

  const createdClass = await convexMutation<{ class_id: string }>(
    "adminClasses:createClass",
    {
      name: className,
      description: "Role visibility verification class",
      admin_username: "admin",
    }
  );

  const createdSession = await convexMutation<{ session_id: string }>(
    "adminSessions:createSession",
    {
      class_id: createdClass.class_id,
      location: sessionLocation,
      date: getFutureDate(12),
      time: "09:30",
      quota_defined: 8,
      admin_username: "admin",
    }
  );

  // regular_admin should not see Edit/Cancel on classes list
  await page.goto("/admin/login");
  await page.getByLabel("Username").fill("staff");
  await page.getByLabel("Password").fill("staff123");
  await page.getByRole("button", { name: "Sign In" }).click();
  await page.waitForURL(/\/admin\/dashboard/, { timeout: 20_000 });

  await page.goto("/admin/classes");
  const classRowAsRegular = page.locator("tbody tr").filter({ hasText: className });
  await expect(classRowAsRegular).toHaveCount(1);
  await expect(classRowAsRegular.getByRole("button", { name: "Edit" })).toHaveCount(0);
  await expect(classRowAsRegular.getByRole("button", { name: "Cancel" })).toHaveCount(0);

  // regular_admin should not see Edit/Cancel on sessions list
  await page.goto(`/admin/classes/${createdClass.class_id}/sessions`);
  const sessionRowAsRegular = page.locator("tbody tr").filter({
    hasText: sessionLocation,
  });
  await expect(sessionRowAsRegular).toHaveCount(1);
  await expect(sessionRowAsRegular.getByRole("button", { name: "Edit" })).toHaveCount(0);
  await expect(sessionRowAsRegular.getByRole("button", { name: "Cancel" })).toHaveCount(0);

  // server-side mutation guards: regular_admin cannot update/cancel class/session
  await expect(
    convexMutation("adminClasses:updateClass", {
      class_id: createdClass.class_id,
      name: `${className} blocked`,
      description: "should fail",
      admin_username: "staff",
    })
  ).rejects.toThrow(/super admin/i);

  await expect(
    convexMutation("adminSessions:cancelSession", {
      session_id: createdSession.session_id,
      admin_username: "staff",
    })
  ).rejects.toThrow(/super admin/i);

  // super_admin should see Edit/Cancel on the same rows
  await page.context().clearCookies();
  await page.goto("/admin/login");
  await page.getByLabel("Username").fill("admin");
  await page.getByLabel("Password").fill("admin123");
  await page.getByRole("button", { name: "Sign In" }).click();
  await page.waitForURL(/\/admin\/dashboard/, { timeout: 20_000 });

  await page.goto("/admin/classes");
  const classRowAsSuper = page.locator("tbody tr").filter({ hasText: className });
  await expect(classRowAsSuper).toHaveCount(1);
  await expect(classRowAsSuper.getByRole("button", { name: "Edit" })).toBeVisible();
  await expect(classRowAsSuper.getByRole("button", { name: "Cancel" })).toBeVisible();

  await page.goto(`/admin/classes/${createdClass.class_id}/sessions`);
  const sessionRowAsSuper = page.locator("tbody tr").filter({
    hasText: sessionLocation,
  });
  await expect(sessionRowAsSuper).toHaveCount(1);
  await expect(sessionRowAsSuper.getByRole("button", { name: "Edit" })).toBeVisible();
  await expect(sessionRowAsSuper.getByRole("button", { name: "Cancel" })).toBeVisible();

  await page.screenshot({ path: "e2e/tc007-screenshot.png", fullPage: true });
});
