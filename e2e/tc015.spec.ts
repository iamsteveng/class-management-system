import { expect, test } from "@playwright/test";

import { buildTermsUrl, resolveAppBaseUrl } from "../lib/appBaseUrl";
import { convexMutation, seedInitialData } from "./qa-utils";

test("TC-015: Hostname regression guard across environments", async () => {
  await seedInitialData();
  const purchase = await convexMutation<{ token: string }>("testPurchase:createTestPurchase", {
    customer_mobile: "+6599015015",
    participant_count: 1,
  });

  const hosts = [
    "staging.class-mgmt.example.com",
    "https://prod.class-mgmt.example.com/frontend",
  ];

  const assertions = [];
  for (const configured of hosts) {
    const resolvedBaseUrl = resolveAppBaseUrl(configured);
    const termsLink = buildTermsUrl(resolvedBaseUrl, purchase.token);
    const parsedConfigured = new URL(configured.startsWith("http") ? configured : `https://${configured}`);
    const parsedTerms = new URL(termsLink);

    expect(parsedTerms.hostname).toBe(parsedConfigured.hostname);
    expect(parsedTerms.hostname).not.toBe("example.com");

    assertions.push({
      configured,
      resolved_base_url: resolvedBaseUrl,
      terms_link: termsLink,
      hostname: parsedTerms.hostname,
    });
  }

  console.log("TC-015 Evidence:", JSON.stringify(assertions, null, 2));
});
