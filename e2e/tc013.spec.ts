import { expect, test } from "@playwright/test";

import { buildTermsUrl, resolveAppBaseUrl } from "../lib/appBaseUrl";
import { convexMutation, seedInitialData } from "./qa-utils";

const TOKEN_PARAM_REGEX = /token=([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})/i;

test("TC-013: Terms link is absolute URL and tokenized", async () => {
  await seedInitialData();
  const purchase = await convexMutation<{ token: string }>("testPurchase:createTestPurchase", {
    customer_mobile: "+6599013013",
    participant_count: 1,
  });

  const termsLink = buildTermsUrl(
    resolveAppBaseUrl("class-management-system-teal.vercel.app"),
    purchase.token
  );
  expect(termsLink).toMatch(/^https?:\/\/[^\s/]+(?:\/[^\s?]*)?\/terms\?token=/i);

  const tokenMatch = termsLink.match(TOKEN_PARAM_REGEX);
  expect(tokenMatch?.[1]).toBe(purchase.token);

  console.log(
    "TC-013 Evidence:",
    JSON.stringify(
      {
        terms_link: termsLink,
        regex: TOKEN_PARAM_REGEX.toString(),
        extracted_token: tokenMatch?.[1] ?? null,
      },
      null,
      2
    )
  );
});
