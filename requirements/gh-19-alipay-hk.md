# GH-19: Alipay HK Payment Method via Airwallex

**GitHub Issue:** #19  
**Status:** Draft

---

## 1. Goals

The end result is a working Alipay HK payment option on the class apply page, alongside the existing credit card option.

### User-facing payment flow

1. A user on the class apply page can choose between **Credit Card** and **Alipay HK** as their payment method.
2. **Desktop browser:** After selecting Alipay HK and clicking Pay, the user sees a QR code on screen. They scan it with the Alipay HK app and complete the payment. The page detects the completed payment and moves the user forward to the passes page.
3. **Mobile browser:** After selecting Alipay HK and clicking Pay, the user is taken to the Alipay HK payment screen. After completing payment, they are brought back to this app and forwarded to the passes page.
4. On the QR code screen, if the QR code expires (10 minutes), the user sees an expiry message and a button to generate a new QR code.
5. Once payment is confirmed, the subsequent flow is identical to the existing credit card flow: the user lands on the passes page with terms form links, and a WhatsApp confirmation is sent.

### Admin refund flow

6. An admin can refund an Alipay HK payment using the existing **Cancel & Refund** button on the Purchases page — no new UI is needed.
7. When the refund is triggered, the money is returned to the user via Alipay HK.

---

## 2. Verifications

> **All behaviours listed below must be verified by scripts (Playwright E2E or API-level tests), not by AI agent judgement.**

### TC-065: Alipay HK tab appears on apply page

**File:** `tests/e2e/tc-065.test.ts`

1. Navigate to `/apply/[class_id]` for a class configured with `airwallex_price`.
2. Assert that a tab or button labelled **Alipay HK** (or `支付寶HK`) is visible.
3. Assert that the existing credit card section is also visible when the Credit Card tab is active.
4. Assert that selecting the Alipay HK tab hides the `#airwallex-card-container` element.

---

### TC-066: `/api/payment/alipay-hk/start` returns QR code for desktop

**File:** `tests/e2e/tc-066.test.ts` (API-level)

1. Call `POST /api/payment/create-intent` with a valid `class_id` and `mobile`. Assert `200` response with `intent_id`.
2. Call `POST /api/payment/alipay-hk/start` with `{ intent_id, class_id, mobile, quantity: 1, is_mobile: false }`.
3. Assert HTTP `200`.
4. Assert response body `type === "qrcode"`.
5. Assert response body `qrcode` is a non-empty string.

---

### TC-067: `/api/payment/alipay-hk/start` returns redirect URL for mobile

**File:** `tests/e2e/tc-067.test.ts` (API-level)

1. Call `POST /api/payment/create-intent` with a valid `class_id` and `mobile`. Assert `200` with `intent_id`.
2. Call `POST /api/payment/alipay-hk/start` with `{ intent_id, class_id, mobile, quantity: 1, is_mobile: true }`.
3. Assert HTTP `200`.
4. Assert response body `type === "redirect"`.
5. Assert response body `url` is a non-empty string starting with `https://`.

---

### TC-068: Desktop apply page renders QR code element after selecting Alipay HK

**File:** `tests/e2e/tc-068.test.ts`

1. Navigate to `/apply/[class_id]` on a desktop viewport (1280×800).
2. Click the Alipay HK tab.
3. Enter a WhatsApp number.
4. Click the Pay button.
5. Assert that a `<canvas>` or `<img>` element for the QR code appears on the page within 10 seconds (mocked: intercept `/api/payment/alipay-hk/start` to return a synthetic `{ type: "qrcode", qrcode: "test-qr-string" }`).
6. Assert the QR code container is visible.
7. Assert the card container `#airwallex-card-container` is not visible.

---

### TC-069: Mobile apply page redirects to Alipay HK URL

**File:** `tests/e2e/tc-069.test.ts`

1. Navigate to `/apply/[class_id]` on a mobile viewport (390×844), with `userAgent` set to an iOS/Android UA string.
2. Intercept `POST /api/payment/alipay-hk/start` and return `{ type: "redirect", url: "https://mock-alipay-hk.example.com/pay" }`.
3. Click Alipay HK tab, enter mobile, click Pay.
4. Assert that `page.url()` changes to `https://mock-alipay-hk.example.com/pay` (i.e. the page navigated to the redirect URL).

---

### TC-070: `/api/payment/alipay-hk/status` returns `succeeded: true` when intent has succeeded

**File:** `tests/e2e/tc-070.test.ts` (API-level)

1. Intercept `GET https://api-demo.airwallex.com/api/v1/pa/payment_intents/{id}` and return a mock response with `status: "SUCCEEDED"`.
2. Call `GET /api/payment/alipay-hk/status?intent_id=fake-intent-id`.
3. Assert HTTP `200` and `{ succeeded: true }`.

---

### TC-071: `/apply/[class_id]/alipay-return` page creates purchases and redirects to passes

**File:** `tests/e2e/tc-071.test.ts`

1. Intercept `GET /api/payment/alipay-hk/status?intent_id=test-intent` to return `{ succeeded: true }`.
2. Intercept `POST /api/payment/confirm` to return `{ tokens: ["tok-abc"] }`.
3. Navigate to `/apply/test-class/alipay-return?intent_id=test-intent&mobile=%2B85291234567&quantity=1&lang=zh-TW`.
4. Assert the page eventually redirects to `/apply/test-class/passes?tokens=tok-abc&mobile=...&lang=zh-TW`.

---

### TC-072: `/apply/[class_id]/alipay-return` shows error when intent has not succeeded

**File:** `tests/e2e/tc-072.test.ts`

1. Intercept `GET /api/payment/alipay-hk/status?intent_id=test-intent` to return `{ succeeded: false }`.
2. Navigate to `/apply/test-class/alipay-return?intent_id=test-intent&mobile=%2B85291234567&quantity=1`.
3. Assert an error message is visible (not a redirect to passes page).

---

### TC-073: QR code expiry countdown and Regenerate button

**File:** `tests/e2e/tc-073.test.ts`

1. Navigate to `/apply/[class_id]` on desktop, click Alipay HK, enter mobile, click Pay (with `/api/payment/alipay-hk/start` mocked to return `{ type: "qrcode", qrcode: "test-qr" }`).
2. Use `page.clock.fastForward(600_000)` (Playwright fake timers) to advance 10 minutes.
3. Assert that a "QR code expired" message is visible.
4. Assert that a **Regenerate** (or `重新生成`) button is visible.
5. Click Regenerate. Assert the QR code container is refreshed (mock the endpoint again; assert the container re-renders).

---

### TC-074: Webhook creates purchase for Alipay HK payment intent

**File:** `tests/e2e/tc-074.test.ts` (API-level, uses Convex dev)

1. Create a test class with `airwallex_price` set via `adminClasses:createClass`.
2. POST to `/api/payment/webhook` with a synthetic `payment_intent.succeeded` event body:
   ```json
   {
     "name": "payment_intent.succeeded",
     "data": {
       "object": {
         "id": "test-intent-alipay-hk",
         "amount": 500,
         "currency": "HKD",
         "metadata": { "class_id": "<class_id>", "mobile": "+85291234567", "quantity": "1" }
       }
     }
   }
   ```
3. Assert HTTP `200` and `{ ok: true }`.
4. Query Convex dev for `purchases` by `order_id = "test-intent-alipay-hk"`.
5. Assert exactly one purchase record exists with `source = "airwallex"` and `status = "pending_terms"`.

---

### TC-075: Cancel & Refund button is visible for Alipay HK purchases on admin purchases page

**File:** `tests/e2e/tc-075.test.ts`

1. Log in as `admin`/`admin123`.
2. Create a test purchase directly in Convex dev with `source = "airwallex"`, `total_price = 500`, `currency = "HKD"`, `status = "pending_terms"`, `refund_status = "none"`.
3. Navigate to `/admin/purchases`.
4. Assert that the row for this purchase shows a **Cancel & Refund** button.
5. Assert the button is not shown for a purchase with `source = "s3"`.

---

### TC-076: Cancel & Refund triggers Airwallex refund API and updates Convex

**File:** `tests/integration/tc-076.test.ts`

1. Create a test purchase in Convex dev with `source = "airwallex"`, `total_price = 500`, `currency = "HKD"`.
2. Log in as `admin`/`admin123`. Navigate to `/admin/purchases`.
3. Intercept `POST https://api-demo.airwallex.com/api/v1/pa/refunds/create` and return `{ id: "refund-abc" }` (to avoid hitting real Airwallex in test).
4. Click **Cancel & Refund**, type `REFUND`, click **Confirm Refund**.
5. Assert the button disappears (purchase row no longer shows the button).
6. Query Convex dev for the purchase — assert `status = "cancelled"`, `refund_status = "refunded"`, `airwallex_refund_id = "refund-abc"`.

---

### TC-077: Alipay HK purchase source stored as "airwallex" (not a new source value)

**File:** `tests/unit/tc-077.test.ts` (unit — schema/type check)

1. Import the Convex schema and assert that the `source` field union for `purchases` does not include a new `"alipayhk"` literal.
2. Assert that `"airwallex"` is one of the allowed values.
3. This verifies that existing refund logic (which checks `source === "airwallex"`) covers Alipay HK without any code change.

---

## 3. Constraints

The following must not be modified as part of this implementation:

- **`/api/payment/webhook`** — the existing handler already processes `payment_intent.succeeded` for all Airwallex intents regardless of payment method. Do not touch it.
- **`/api/payment/create-intent`** — the intent creation payload does not specify payment method; this is correct and should remain unchanged. The only permitted addition is returning `return_url` (for the client to use when calling the alipay-hk start endpoint), if not already present.
- **`app/admin/purchases/actions.ts` (`cancelAndRefundAction`)** — the refund action is payment-method-agnostic. It calls the Airwallex refund API for any `source === "airwallex"` purchase. No modification is needed.
- **`convex/purchaseRefundDb.ts`** — no changes to the DB refund mutation.
- **`convex/schema.ts` `purchases.source` union** — must remain `"s3" | "payment_gateway" | "airwallex"`. Alipay HK purchases are `source = "airwallex"`.
- **`convex/payments.ts` (`createPurchaseFromAirwallex`)** — the purchase creation action is payment-method-agnostic. Do not touch it.
- **`/terms` page and terms flow** — no changes.
- **`/participant/[participant_id]` page** — no changes.
- **`convex/purchaseConfirmation.ts`** — WhatsApp confirmation is called inside `createPurchaseFromAirwallex`. No changes.
- **Existing credit card flow on `/apply/[class_id]`** — must remain fully functional. Adding the Alipay HK tab must not regress the card element flow.
- **Production Convex deployment** — all test data must use `graceful-mole-393` (dev). Do not write to `colorless-raven-523` (prod).

---

## 4. When You Need Human Feedback

Write observations as PR comments tagging `@iamsteveng` when any of the following apply:

### 4.1 Airwallex demo environment may not support Alipay HK

The Airwallex sandbox (`api-demo.airwallex.com`) may not have Alipay HK enabled by default. If `POST /api/v1/pa/payment_intents/{id}/confirm` with `type: "alipayhk"` returns a `400` or `422` error in the demo environment:

> **Observation:** Airwallex demo returned `{error_code}` when attempting to confirm with Alipay HK. This suggests the demo account does not have Alipay HK enabled.  
> **Suggested action:** Please enable Alipay HK on the Airwallex demo account at [Airwallex Dashboard](https://www.airwallex.com/app/), or confirm whether end-to-end Alipay HK testing should be done in production-mode only.

### 4.2 E2E test for actual QR scan or mobile redirect is not automatable

Scanning a QR code with a real Alipay HK app, or completing a mobile payment on the Alipay HK native page, cannot be scripted with Playwright. TC-068 and TC-069 mock the API responses to verify UI behaviour only. The actual payment completion must be tested manually.

> **Observation:** TC-068 and TC-069 verify UI rendering and navigation using mocked API responses. They do not verify that a real Alipay HK payment results in a completed purchase. Manual end-to-end verification is required before launch.  
> **Suggested action:** Please confirm whether a manual QA sign-off checklist is sufficient, or if a Airwallex test Alipay HK account can be provisioned for automated testing.

### 4.3 `return_url` requirement in Airwallex intent

The Airwallex docs state `return_url` is required in the payment intent for the mobile_web flow. The current `create-intent` route does not include it. Two options exist:
- Pass `return_url` from the client (the apply page knows the class_id and can construct it).
- Have the server construct it from `APP_BASE_URL`.

> **Suggested approach:** Construct `return_url` server-side using `APP_BASE_URL` env var (already present in the Convex env), passed in the intent creation body when the alipay-hk flow is requested. If this does not match the actual deployed URL, tag `@iamsteveng` to confirm the correct base URL to use.

### 4.4 Payment method selection UI design is not specified

The issue does not specify whether **both** Credit Card and Alipay HK should always appear on every class, or only on classes explicitly configured for Alipay HK. Currently, classes have `airwallex_price` but no separate `alipay_hk_enabled` flag.

> **Observation:** It is unclear whether Alipay HK should be available for all classes that have `airwallex_price`, or only for a subset. If a new per-class flag is needed, the Convex schema and admin class edit modal must be updated.  
> **Suggested action:** Please confirm the expected behaviour. If both methods should always be shown together, no schema change is needed. If per-class control is required, tag `@iamsteveng` before schema changes are made.

### 4.5 A predefined test case is found to be untestable or incorrect

If any test case in Section 2 cannot be implemented as described (e.g. the API does not return the asserted shape, the page does not render the expected element, or the Convex helper mutation does not exist), leave a PR comment:

> **Test case:** TC-0XX  
> **Observation:** [what the actual behaviour is]  
> **Suggested change:** [proposed correction to the test case]  
> **Tagging:** @iamsteveng
