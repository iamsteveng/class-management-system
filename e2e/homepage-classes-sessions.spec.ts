import { expect, test } from "@playwright/test";

test("homepage shows class buttons and filters sessions by selected class", async ({
  page,
}) => {
  await page.route("**/api/classes", async (route) => {
    await new Promise((resolve) => setTimeout(resolve, 150));
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        classes: [
          { class_id: "class-1", class_name: "Yoga Basics" },
          { class_id: "class-2", class_name: "Spin Class" },
        ],
      }),
    });
  });

  await page.route("**/api/classes/class-1/sessions", async (route) => {
    await new Promise((resolve) => setTimeout(resolve, 150));
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        sessions: [
          {
            session_id: "s1",
            location: "Room A",
            date: "2026-03-20",
            time: "09:00",
            quota_available: 8,
          },
        ],
      }),
    });
  });

  await page.route("**/api/classes/class-2/sessions", async (route) => {
    await new Promise((resolve) => setTimeout(resolve, 150));
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ sessions: [] }),
    });
  });

  await page.goto("/");

  await expect(page.getByText("Loading classes...")).toBeVisible();
  await expect(page.getByRole("button", { name: "Yoga Basics" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Spin Class" })).toBeVisible();

  await expect(page.getByText("Room A")).toBeVisible();
  await expect(page.getByText("Available quota: 8")).toBeVisible();

  await page.getByRole("button", { name: "Spin Class" }).click();

  await expect(page.getByText("Loading sessions...")).toBeVisible();
  await expect(
    page.getByText("No sessions are available for this class.")
  ).toBeVisible();
  await expect(page.getByText("Room A")).not.toBeVisible();
});
