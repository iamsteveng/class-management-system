import { expect, test } from "@playwright/test";

import { buildTermsUrl, resolveAppBaseUrl } from "../lib/appBaseUrl";
import { convexMutation, seedInitialData } from "./qa-utils";

test("TC-014: Clicked terms link loads valid page for that token", async ({ page }) => {
  await seedInitialData();
  const purchase = await convexMutation<{ token: string }>("testPurchase:createTestPurchase", {
    customer_mobile: "+6599014014",
    participant_count: 1,
  });

  const baseURL = String(test.info().project.use.baseURL ?? "https://class-management-system-teal.vercel.app");
  const termsLink = buildTermsUrl(resolveAppBaseUrl(baseURL), purchase.token);
  await page.goto(termsLink);
  await expect(page).toHaveURL(new RegExp(`/terms\\?token=${purchase.token}`));
  await expect(page.getByRole("heading", { name: "Terms Acceptance" })).toBeVisible();

  await page.screenshot({ path: "qa-artifacts/TC-014-terms-link-loads.png", fullPage: true });
});
