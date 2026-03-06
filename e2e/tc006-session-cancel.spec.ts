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

type TermsPageData = {
  sessions: Array<{
    session_id: string;
  }>;
} | null;

function getFutureDate(daysAhead: number) {
  const date = new Date();
  date.setDate(date.getDate() + daysAhead);
  return date.toISOString().slice(0, 10);
}

test("BUG-TC-006: Super admin can cancel a session and cancelled session is excluded from terms selector", async ({
  page,
}) => {
  await seedInitialData();
  const sessionLocation = `TC006 Cancel Location ${Date.now()}`;

  const createdClass = await convexMutation<{ class_id: string }>(
    "adminClasses:createClass",
    {
      name: `TC006 Class ${Date.now()}`,
      description: "Session cancel class",
      admin_username: "admin",
    }
  );

  const createdSession = await convexMutation<{ session_id: string }>(
    "adminSessions:createSession",
    {
      class_id: createdClass.class_id,
      location: sessionLocation,
      date: getFutureDate(11),
      time: "10:00",
      quota_defined: 16,
      admin_username: "admin",
    }
  );

  const purchase = await convexMutation<{ token: string }>(
    "testPurchase:createTestPurchase",
    {
      customer_mobile: `+1555${Date.now().toString().slice(-7)}`,
      participant_count: 1,
    }
  );

  await page.goto("/admin/login");
  await page.getByLabel("Username").fill("admin");
  await page.getByLabel("Password").fill("admin123");
  await page.getByRole("button", { name: "Sign In" }).click();
  await page.waitForURL(/\/admin\/dashboard/, { timeout: 20_000 });

  await page.goto(`/admin/classes/${createdClass.class_id}/sessions`);

  const sessionRow = page.locator("tbody tr").filter({
    hasText: sessionLocation,
  });
  await expect(sessionRow).toHaveCount(1);
  await expect(sessionRow.getByRole("button", { name: "Cancel" })).toBeVisible();

  page.on("dialog", (dialog) => dialog.accept());
  await sessionRow.getByRole("button", { name: "Cancel" }).click();

  await page.waitForURL(
    new RegExp(
      `/admin/classes/${createdClass.class_id}/sessions\\?status=session_cancelled`
    ),
    { timeout: 20_000 }
  );
  await expect(page.getByText("Session cancelled successfully.")).toBeVisible();
  const cancelledRow = page.locator("tbody tr").filter({
    hasText: sessionLocation,
  });
  await expect(cancelledRow.getByText("cancelled")).toBeVisible();
  await expect(
    cancelledRow.getByRole("button", { name: "Cancel" })
  ).toBeDisabled();

  const updatedPageData = await convexQuery<SessionManagementPageData>(
    "adminSessions:getSessionManagementPageData",
    { class_id: createdClass.class_id }
  );
  const cancelledSession = updatedPageData?.sessions.find(
    (session) => session.session_id === createdSession.session_id
  );
  expect(cancelledSession?.status).toBe("cancelled");

  const termsData = await convexQuery<TermsPageData>("terms:getTermsPageData", {
    token: purchase.token,
  });
  expect(
    termsData?.sessions.some(
      (session) => session.session_id === createdSession.session_id
    )
  ).toBe(false);

  await page.goto(`/terms?token=${encodeURIComponent(purchase.token)}`);
  const cancelledOption = page
    .locator("select#session_id option")
    .filter({ hasText: sessionLocation });
  await expect(cancelledOption).toHaveCount(0);

  await page.screenshot({
    path: "e2e/tc006-session-cancel-screenshot.png",
    fullPage: true,
  });
});
