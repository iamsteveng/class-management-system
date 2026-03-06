import { expect, test } from "@playwright/test";

const CONVEX_URL = "https://graceful-mole-393.convex.cloud";

async function convexMutation(path: string, args: Record<string, unknown>) {
  const response = await fetch(`${CONVEX_URL}/api/mutation`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ path, args, format: "json" }),
  });
  const payload = (await response.json()) as {
    status: string;
    errorMessage?: string;
  };

  if (payload.status !== "success") {
    throw new Error(`Mutation ${path} failed: ${payload.errorMessage ?? "unknown error"}`);
  }
}

test("BUG-TC-001/002/003/004: Admin navigation is persistent and routes correctly", async ({
  page,
}) => {
  await convexMutation("seed:seedInitialData", {});

  await page.goto("/admin/login");
  await page.getByLabel("Username").fill("admin");
  await page.getByLabel("Password").fill("admin123");
  await page.getByRole("button", { name: "Sign In" }).click();
  await page.waitForURL(/\/admin\/dashboard/, { timeout: 20_000 });

  const nav = page.locator('nav[aria-label="Admin navigation"]');
  await expect(nav).toBeVisible();

  const expectations = [
    { label: "Dashboard", href: "/admin/dashboard", heading: "Admin Dashboard" },
    { label: "Classes", href: "/admin/classes", heading: "Classes" },
    { label: "Sessions", href: "/admin/sessions", heading: "Sessions" },
    { label: "Participants", href: "/admin/participants", heading: "Participants" },
    { label: "Terms", href: "/admin/terms", heading: "Terms" },
  ];

  for (const item of expectations) {
    const link = nav.getByRole("link", { name: item.label });
    await expect(link).toHaveAttribute("href", item.href);
    const currentPath = new URL(page.url()).pathname;
    if (currentPath !== item.href) {
      await link.click();
    }
    await expect(page).toHaveURL(new RegExp(`${item.href.replace("/", "\\/")}$`));
    await expect(page.getByRole("heading", { name: item.heading })).toBeVisible();
    await expect(link).toHaveAttribute("aria-current", "page");
    await expect(nav).toBeVisible();
  }

  await page.screenshot({ path: "e2e/tc002-admin-nav-screenshot.png", fullPage: true });
});
