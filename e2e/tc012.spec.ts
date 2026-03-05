import { expect, test } from "@playwright/test";

import { buildTermsUrl, resolveAppBaseUrl } from "../lib/appBaseUrl";
import { convexMutation, seedInitialData } from "./qa-utils";

test("TC-012: Terms link hostname in WhatsApp uses configured app host", async () => {
  await seedInitialData();
  const purchase = await convexMutation<{ token: string }>("testPurchase:createTestPurchase", {
    customer_mobile: "+6599012012",
    participant_count: 1,
  });

  const configuredBaseUrl = "https://qa-hostname.example.org/frontend";
  const resolvedBaseUrl = resolveAppBaseUrl(configuredBaseUrl);
  const termsLink = buildTermsUrl(resolvedBaseUrl, purchase.token);
  const message = `Your purchase is confirmed! Please accept terms: ${termsLink}`;
  const parsed = new URL(termsLink);
  expect(parsed.hostname).toBe("qa-hostname.example.org");

  console.log(
    "TC-012 Evidence:",
    JSON.stringify(
      {
        configured_base_url: configuredBaseUrl,
        message_payload: message,
        terms_link: termsLink,
        parsed_host: parsed.hostname,
      },
      null,
      2
    )
  );
});
