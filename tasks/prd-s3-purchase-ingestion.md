# PRD: AWS S3 Purchase Ingestion

## Introduction

Integrate the class management system with an AWS S3 bucket to automatically ingest purchase records from CSV files. When new purchase CSVs are detected in the S3 bucket, the system parses them, maps the product ID to the correct class, inserts purchase records into the database, and triggers a WhatsApp message to the customer for term acceptance.

This is a transitional integration — in the medium term, users will purchase directly through the class management homepage (direct payment gateway). This feature must be designed with that transition in mind, ensuring the purchase creation logic is decoupled from the S3 ingestion trigger.

---

## CSV Format

Files are named with timestamp and UUID (e.g. `202603271622---adf4022b-0ca4-456d-9d7f-e11c3800f861.csv`).

Columns: `order_id`, `product_id`, `user_phone`, `qty`, `unit_price`, `total`

```
order_id, product_id, user_phone, qty, unit_price, total
36, 3, +85254304789, 1, 100.0000, 100.0000
```

**Important:** A single file may contain multiple rows. If a customer purchases two different products in one order, the file will contain two rows with the same `order_id` but different `product_id` values. Each row maps to a separate purchase record (one per product/class).

Mobile numbers are already in E.164 format (e.g. `+85254304789`) — no normalisation needed.

---

## Goals

- Automatically pick up new purchase CSV files from S3 every 5 minutes
- Map external product IDs to internal class IDs (per environment: dev/uat/prod)
- Insert one `purchase` record per CSV row into the Convex database
- Trigger the existing WhatsApp term acceptance message per purchase record
- Move processed files from `{ENV}/new/` to `{ENV}/processed/` after ingestion
- Alert on S3 connectivity errors
- Provide an admin UI for ingestion monitoring and manual triggering
- Prepare `createPurchase` logic for future direct payment gateway reuse

---

## User Stories

### US-001: S3 polling scheduled action
**Description:** As the system, I want to poll S3 for new CSV files on a schedule so that purchases are ingested automatically.

**Acceptance Criteria:**
- [ ] A Convex scheduled action in `convex/s3Ingestion.ts` runs every 5 minutes via `convex/crons.ts`
- [ ] It connects to AWS S3 using credentials from Convex env vars: `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_REGION`
- [ ] S3 bucket name is read from Convex env var `S3_BUCKET_NAME` (value: `mart-order-887306483832-ap-southeast-1-an`)
- [ ] File key prefix is `{ENV}/new/` where `ENV` is read from Convex env var `APP_ENV` (`dev` | `uat` | `prod`)
- [ ] The action uses `"use node"` directive (required for AWS SDK)
- [ ] Typecheck passes

### US-002: S3 error alerting
**Description:** As an operator, I want to be alerted when the S3 bucket is unreachable so that I can investigate connectivity or credential issues promptly.

**Acceptance Criteria:**
- [ ] If the S3 `ListObjectsV2` call fails (network error, auth error, bucket not found), the error is logged with full details (error message, timestamp, `APP_ENV`)
- [ ] An ingestion run record is written to the `ingestion_runs` table with `status: "error"` and the error message stored
- [ ] The polling continues on the next schedule tick (error does not crash the scheduler)
- [ ] Typecheck passes

### US-003: Product-to-class ID mapping config
**Description:** As a developer, I want a per-environment mapping from product IDs to internal class IDs so that purchase records are linked to the correct class.

**Acceptance Criteria:**
- [ ] A config file `convex/productMapping.ts` exports a mapping object keyed by environment (`dev`, `uat`, `prod`)
- [ ] Each entry maps external product IDs (strings) to internal `class_id` strings
- [ ] Mapping is used during CSV ingestion to resolve `class_id` before inserting the purchase
- [ ] If a product ID is not found in the mapping, the ingestion logs a warning and skips that row (does not crash)
- [ ] File includes a comment with an example mapping structure for developer reference
- [ ] Typecheck passes

### US-004: CSV parsing and purchase insertion
**Description:** As the system, I want to parse each row in a purchase CSV and insert a purchase record so that the customer can receive their term acceptance message.

**Acceptance Criteria:**
- [ ] CSV columns parsed: `order_id`, `product_id`, `user_phone`, `qty`, `unit_price`, `total` (with trimming of whitespace around values)
- [ ] Each row is treated as an independent purchase record (one row = one purchase)
- [ ] The same `order_id` can appear on multiple rows (one per product) — each gets its own purchase record
- [ ] For each valid row, the system calls the shared `createPurchase` mutation (US-005)
- [ ] `qty` is parsed as an integer and stored as `participant_count`
- [ ] `user_phone` is stored as-is (already E.164 format)
- [ ] Rows with unknown product IDs are skipped with a warning log (file still continues processing)
- [ ] Typecheck passes

### US-005: Shared `createPurchase` mutation (payment-gateway ready)
**Description:** As a developer, I want a reusable Convex mutation for creating purchases so that both S3 ingestion and the future direct payment gateway share the same logic.

**Acceptance Criteria:**
- [ ] A Convex mutation `convex/purchases.ts: createPurchase` accepts: `order_id` (string), `customer_mobile` (string), `participant_count` (number), `class_id` (optional string), `source` (`"s3"` | `"payment_gateway"`), `unit_price` (optional number), `total_price` (optional number), `purchase_datetime` (string, ISO 8601)
- [ ] The mutation generates a UUID v4 `token`, sets `status: "pending_terms"`, and inserts the purchase
- [ ] It returns the new `purchase._id`
- [ ] `purchase_datetime` is supplied by the caller — for S3 ingestion, it is parsed from the CSV filename (e.g. `202603271622` → `2026-03-27T16:22:00`)
- [ ] The `source` field is stored in the purchase record for auditing
- [ ] Duplicate detection: if the same `order_id` + `product_id`/`class_id` combination already exists, skip and return existing `_id` (idempotent — safe for reprocessing)
- [ ] Typecheck passes

### US-006: Move processed files in S3
**Description:** As the system, I want to move successfully processed CSV files to `{ENV}/processed/` so that they are not reprocessed on the next poll.

**Acceptance Criteria:**
- [ ] After all rows in a file are attempted, the file is copied to `{ENV}/processed/{original-filename}` in S3
- [ ] The original file is then deleted from `{ENV}/new/`
- [ ] If the copy or delete fails, the error is logged but polling continues (file will be reprocessed next tick — idempotency in US-005 prevents duplicates)
- [ ] Typecheck passes

### US-007: Trigger WhatsApp term acceptance message after purchase creation
**Description:** As the system, I want to send a WhatsApp message to the customer after a purchase record is created so that they can accept terms and select a session.

**Acceptance Criteria:**
- [ ] After `createPurchase` succeeds, the ingestion action calls the existing `purchaseConfirmation:sendPurchaseConfirmation` action with the new `purchase_id`
- [ ] If WhatsApp sending fails, the purchase record remains in the database with `status: "pending_terms"` (not rolled back)
- [ ] The WhatsApp failure is logged with `order_id` and error details
- [ ] Typecheck passes

### US-008: Ingestion run logging in database
**Description:** As the system, I want to persist a log of every ingestion run so that admins can audit history.

**Acceptance Criteria:**
- [ ] Add `ingestion_runs` table to `convex/schema.ts` with fields: `run_at` (number), `status` (`"success"` | `"partial"` | `"error"`), `files_processed` (number), `rows_inserted` (number), `rows_skipped` (number), `error_message` (optional string)
- [ ] Every S3 poll writes one `ingestion_runs` record on completion (success or error)
- [ ] `status: "partial"` is used when some rows failed/were skipped but others succeeded
- [ ] Typecheck passes

### US-009: Admin ingestion monitoring UI
**Description:** As a super admin, I want to see a log of recent S3 ingestion runs and trigger a manual poll so that I can diagnose issues without waiting for the next scheduled run.

**Acceptance Criteria:**
- [ ] New admin page at `/admin/ingestion`
- [ ] Page shows a table of the last 20 ingestion runs with columns: timestamp, status (with colour: green=success, yellow=partial, red=error), files processed, rows inserted, rows skipped, error message
- [ ] A "Poll Now" button triggers an immediate S3 poll (calls the ingestion action directly)
- [ ] "Poll Now" button is only visible and accessible to users with `role: "super_admin"` — other admin roles see the page but not the button
- [ ] Page is linked from the admin nav (visible to all admins)
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

---

## Functional Requirements

- FR-1: S3 polling runs every 5 minutes via Convex `cronJobs`
- FR-2: AWS credentials and bucket config stored in Convex environment variables
- FR-3: File prefix pattern: `{APP_ENV}/new/` for pickup, `{APP_ENV}/processed/` for done
- FR-4: Product-to-class mapping defined in `convex/productMapping.ts`, keyed by environment
- FR-5: One purchase record is inserted per CSV row (not per file)
- FR-6: Same `order_id` can map to multiple purchase records (one per product/class)
- FR-7: Duplicate `order_id` + `class_id` combinations are skipped idempotently
- FR-8: `qty` stored as `participant_count`; `user_phone` stored as-is (E.164)
- FR-9: Each new purchase triggers `sendPurchaseConfirmation` (existing WhatsApp/Twilio flow)
- FR-10: Processed files moved from `new/` → `processed/` after all rows attempted
- FR-11: S3 connectivity errors are logged and written to `ingestion_runs` with `status: "error"`
- FR-12: `createPurchase` mutation is the single source of truth for purchase creation
- FR-13: `source` field added to `purchases` schema (`"s3"` | `"payment_gateway"`)
- FR-14: Admin UI at `/admin/ingestion` shows last 20 runs and exposes manual trigger

---

## Non-Goals

- No direct payment gateway integration (future work — `createPurchase` is prepared for it)
- No retry logic for failed WhatsApp sends
- No S3 event notification / webhook trigger (polling only)
- No UI for managing product-to-class mappings (config file in code only)
- No CSV file format validation beyond required column presence
- No partial row rollback (rows are processed independently)

---

## Technical Considerations

- **AWS SDK:** Use `@aws-sdk/client-s3` (v3 modular). Convex Node.js actions require `"use node"` directive.
- **CSV parsing:** Use `csv-parse/sync` for simplicity. Trim whitespace from all values (the sample CSV has spaces after commas).
- **Convex scheduling:** Use `cronJobs` in `convex/crons.ts`.
- **Schema changes:**
  - Add `source: v.optional(v.union(v.literal("s3"), v.literal("payment_gateway")))` to `purchases` table (optional for backwards compat)
  - Add new `ingestion_runs` table
- **Filename timestamp parsing:** The filename format is `YYYYMMDDHHmm---<uuid>.csv`. Parse the first 12 characters as the purchase datetime: `202603271622` → `2026-03-27T16:22:00`. This is passed as `purchase_datetime` to `createPurchase`.
- **Existing flow reuse:** `sendPurchaseConfirmation` in `convex/purchaseConfirmation.ts` already handles WhatsApp — call it directly after insertion.
- **Product mapping example:**
  ```ts
  // convex/productMapping.ts
  export const productMapping: Record<string, Record<string, string>> = {
    dev:  { "3": "class_dev_001" },
    uat:  { "3": "class_uat_001" },
    prod: { "3": "class_prod_001" },
  };
  ```
- **Idempotency key:** Use `order_id` + `class_id` composite check for duplicate detection (not just `order_id`, since one order can map to multiple classes).

---

## Success Metrics

- CSV files in `{ENV}/new/` are picked up and processed within 5 minutes of arrival
- 100% of valid rows result in a purchase record + WhatsApp trigger
- Zero duplicate purchase records when a file is reprocessed
- S3 errors are visible in admin UI within the next poll cycle
- `createPurchase` requires zero changes to support future payment gateway

---

## Open Questions

1. Does the `super_admin` role already exist in the admin auth system, or does it need to be added as a new role? Please confirm the current role model.

---

## Amendment: Terms Page Session Filtering (2026-03-31)

### US-010: Filter sessions to upcoming dates only in terms acceptance form
**Description:** As a customer, I want to only see upcoming (future) sessions when accepting terms, so I don't accidentally select a past session.

**Acceptance Criteria:**
- [ ] In `convex/terms.ts` `getTermsPageData`, after filtering by `status === "scheduled"` and `available_quota > 0`, add a filter to exclude sessions where `date + time` is in the past (i.e. earlier than current UTC datetime)
- [ ] A session is considered "upcoming" if `new Date(`${session.date}T${session.time}`) > new Date()` at query time
- [ ] Past sessions (even if still `scheduled` with available quota) are excluded from the list
- [ ] All existing filters remain: `status === "scheduled"`, `available_quota > 0`, sorted by date+time ascending
- [ ] Typecheck passes
- [ ] Existing tests updated/added to verify past sessions are excluded

### US-011: Return empty session list when no class_id matched
**Description:** As a customer, I should not see sessions from unrelated classes if my purchase has no valid class_id mapping, so I am not confused by irrelevant options.

**Acceptance Criteria:**
- [ ] In `convex/terms.ts` `getTermsPageData`, if `purchase.class_id` is null/undefined/empty, return an empty `sessions` array instead of fetching all sessions
- [ ] No sessions are shown to the customer when there is no class mapping
- [ ] The terms form still renders (with a "no available sessions" message) — it should not error
- [ ] Typecheck passes
- [ ] Test added verifying empty sessions returned when purchase has no class_id

### Functional Requirements (additions)
- FR-15: Sessions shown in terms acceptance form must have `date+time > now` (upcoming only)
- FR-16: If purchase has no `class_id`, return empty sessions array (do not fall back to all sessions)

---

## Amendment: Height Field Type and Label (2026-03-31)

### US-012: Change height field to number type and update label
**Description:** As a customer filling in the terms acceptance form, I want the height field to accept a numeric value in centimetres with a clear bilingual label, so there is no ambiguity about the unit or format expected.

**Acceptance Criteria:**
- [ ] In `convex/schema.ts`, change `height` field in `participants` table from `v.optional(v.string())` to `v.optional(v.number())`
- [ ] In `convex/terms.ts` `acceptTermsByToken`, parse the submitted height value as a number (`parseFloat` or `Number()`) before storing; if not a valid number, store `undefined`
- [ ] In `app/terms/terms-form.tsx`, change the height input `type` from `text` to `number` and set `min="0"`
- [ ] Update the height field label in the i18n translations to display `身高（厘米） / Height (cm)` bilingually
- [ ] The label must show in both Chinese and English regardless of selected language — format: `身高（厘米） Height (cm)`
- [ ] Typecheck passes
- [ ] Test added or updated to verify height is stored as a number

---

## Amendment: Fix height type in all Convex validators and frontend types (2026-03-31)

### US-013: Update all Convex query/mutation validators and frontend types for height as number

**Description:** As a developer, I want all Convex validators and frontend TypeScript types that reference `height` to use `number` instead of `string`, so that the participant page and admin panel don't throw `ReturnsValidationError` after the schema change in US-012.

**Root cause:** US-012 changed `participants.height` in `schema.ts` from `v.optional(v.string())` to `v.optional(v.number())`, but the return validators and TypeScript interfaces in three other files still declare `height` as `string`.

**Affected files (all must be updated):**

1. `convex/participants.ts` — `getParticipantPageData` return validator: `height: v.optional(v.string())` → `height: v.optional(v.float64())`
2. `convex/adminParticipants.ts` — participant detail return validator: `height: v.optional(v.string())` → `height: v.optional(v.float64())`
3. `convex/testPurchase.ts` — test helper return validator: `height: v.optional(v.string())` → `height: v.optional(v.float64())`
4. `app/admin/participants/[participant_id]/page.tsx` — TypeScript interface: `height?: string` → `height?: number`

**Acceptance Criteria:**
- [ ] `convex/participants.ts` return validator updated to `v.optional(v.float64())` for height
- [ ] `convex/adminParticipants.ts` return validator updated to `v.optional(v.float64())` for height
- [ ] `convex/testPurchase.ts` return validator updated to `v.optional(v.float64())` for height
- [ ] `app/admin/participants/[participant_id]/page.tsx` TypeScript interface updated to `height?: number`
- [ ] `/participant/[participant_id]` page loads without `ReturnsValidationError` for participants with a numeric height
- [ ] Typecheck passes
- [ ] Existing tests pass; add/update test verifying `getParticipantPageData` returns height as number

---

## Amendment: Terms page revisit UX + participant pass name removal (2026-03-31)

### US-014: Show success state when user revisits terms page after submission
**Description:** As a customer, when I revisit the terms acceptance page after already completing my submission, I want to see the success state (with the button to open my participant pass), not the form again.

**Acceptance Criteria:**
- [ ] In `convex/terms.ts` `getTermsPageData`, when `purchase.status === "terms_accepted"`, include the `participant_id` in the returned data
- [ ] In `app/terms/page.tsx`, when `pageData.purchase_status === "terms_accepted"`, render the success UI directly (same success screen shown after form submission) without requiring `?status=success` in the URL
- [ ] The success UI includes the "Open your QR Code" button linking to `/participant/{participant_id}`
- [ ] If the purchase has multiple participants, link to the first participant's page
- [ ] Typecheck passes

### US-015: Remove participant name field from participant pass page
**Description:** As a developer, I want to remove the participant name field from the participant pass page since we don't store participant names in the database.

**Acceptance Criteria:**
- [ ] In `app/participant/[participant_id]/ParticipantPageContent.tsx`, remove the participant name `<dt>/<dd>` row from the participant details section
- [ ] Remove or hide any i18n label for `participantNameLabel` that is no longer needed in the participant pass page
- [ ] The participant details section still renders correctly without the name row
- [ ] Typecheck passes

---

## Amendment: Participant pass terms display + bilingual success state (2026-03-31)

### US-016: Show accepted terms content on participant pass page
**Description:** As a customer, I want to see the terms I accepted displayed on my participant pass page, so I can reference what I agreed to.

**Acceptance Criteria:**
- [ ] In `convex/participants.ts` `getParticipantPageData`, look up the `terms_version_id` from the participant record and fetch the corresponding `terms_versions` document; include `terms_version` (version string) and `terms_content` (full text) in the returned data
- [ ] If participant has no `terms_version_id`, omit the terms section gracefully (no error)
- [ ] In `app/participant/[participant_id]/ParticipantPageContent.tsx`, add a new section below the QR code section displaying the accepted terms content
- [ ] Section heading should be bilingual following the existing language toggle: ZH: `已接受條款`, EN: `Accepted Terms`
- [ ] Terms version is shown (e.g. `v1.0`) and full terms text displayed below it in a scrollable/readable block
- [ ] Typecheck passes

### US-017: Bilingual success state on /terms page
**Description:** As a customer, I want the success state on the terms acceptance page to display in the language I have selected (default Traditional Chinese), so the confirmation message is in my preferred language.

**Acceptance Criteria:**
- [ ] The success state rendered in `app/terms/page.tsx` (both post-submission and revisit) uses the `LanguageProvider` / `useLanguage` context to determine the active language
- [ ] All text in the success state (heading, button text, helper text) uses the existing bilingual translations from `termsTranslations` (`zh-TW` / `en`)
- [ ] Default language is Traditional Chinese (`zh-TW`) when no language has been selected
- [ ] The language toggle (already present in the header) works on the success state page — switching language updates the success state text
- [ ] Typecheck passes

---

## Amendment: Replace Twilio with ManyChat for WhatsApp sending (2026-03-31)

### US-018: Replace Twilio WhatsApp provider with ManyChat

**Description:** As a developer, I want to send WhatsApp messages via ManyChat instead of Twilio, using an approved WhatsApp template with a `terms_url` parameter.

**Background:**
- Current implementation: `lib/twilio.ts` wraps the Twilio SDK and sends free-form text messages
- New implementation: ManyChat API using an approved WhatsApp template named `"Terms acceptance"` with custom field `cuf_14438749` set to the terms URL
- ManyChat API requires a subscriber ID (not phone number directly) — must first look up subscriber by phone via `POST /fb/subscriber/findBySystemField`

**ManyChat API flow:**
1. `POST https://api.manychat.com/fb/subscriber/findBySystemField` with `{ field_name: "whatsapp_phone", field_value: "<E.164 phone>" }` → returns `{ data: { id: <subscriber_id> } }`
2. `POST https://api.manychat.com/fb/sending/sendContent` with subscriber ID and template content including `cuf_14438749` set to the terms URL

**Acceptance Criteria:**
- [ ] Create `lib/manychat.ts` with a `sendTermsAcceptanceWhatsApp({ to, termsUrl })` function that:
  - Calls ManyChat `findBySystemField` to resolve subscriber ID from phone number
  - If subscriber not found, logs warning and returns `false`
  - Calls ManyChat `sendContent` with the `"Terms acceptance"` template and `cuf_14438749: termsUrl`
  - Returns `true` on success, `false` on any error
  - Reads `MANYCHAT_API_KEY` from env
- [ ] Update `convex/purchaseConfirmation.ts` to import and call `sendTermsAcceptanceWhatsApp` from `lib/manychat.ts` instead of `sendWhatsApp` from `lib/twilio.ts`
- [ ] Remove all `TWILIO_*` credential references from `convex/purchaseConfirmation.ts`
- [ ] `convex/participantLinks.ts` — remove WhatsApp sending entirely (drop the second WhatsApp message that sends participant links; keep only the Convex mutation logic)
- [ ] Delete `lib/twilio.ts`
- [ ] Remove `twilio` npm package from `package.json`
- [ ] Add `MANYCHAT_API_KEY` to Convex env vars (documented in README or .env.example)
- [ ] Typecheck passes
- [ ] Test added verifying `sendTermsAcceptanceWhatsApp` calls the correct ManyChat endpoints with correct payload (mock fetch)

**Env vars:**
- Add: `MANYCHAT_API_KEY`
- Remove: `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_FROM_NUMBER`

**ManyChat sendContent payload structure:**
```json
{
  "subscriber_id": 12345,
  "data": {
    "version": "v2",
    "content": {
      "messages": [
        {
          "type": "whatsapp_template",
          "template_name": "Terms acceptance",
          "language": { "code": "zh_HK" },
          "components": [
            {
              "type": "button",
              "sub_type": "url",
              "index": 0,
              "parameters": [{ "type": "text", "text": "<terms_url>" }]
            }
          ]
        }
      ]
    }
  }
}
```
*(Exact payload structure should be validated against ManyChat docs / template config — adjust if needed)*

---

## Amendment: Fix ManyChat subscriber lookup and creation race condition (2026-03-31)

### US-019: Handle "subscriber already exists" error from ManyChat createSubscriber

**Description:** As a developer, I want the ManyChat integration to correctly handle the case where a subscriber already exists in ManyChat but was not found via `findBySystemField`, so that WhatsApp messages are sent reliably without errors.

**Root cause:** Two failure modes observed:
1. `findBySystemField` with `field_name: "whatsapp_phone"` returns non-OK (HTTP 495) even when the subscriber exists — likely because the phone was registered via `createSubscriber` not via WhatsApp opt-in, so the `whatsapp_phone` system field lookup behaves differently
2. `createSubscriber` returns HTTP 400 `"This WhatsApp ID already exists"` — the subscriber exists but we couldn't find them in step 1

**Fix approach:**
- When `createSubscriber` returns HTTP 400 with `"WhatsApp ID already exists"`, extract the `wa_id` (e.g. `85262875094`) from the error and use it to look up the subscriber via a different field or endpoint
- Try `findBySystemField` with `field_name: "wa_id"` and `field_value: "<phone without + prefix>"` as a fallback
- If that also fails, try `field_name: "whatsapp_phone"` with phone stripped of `+` prefix (e.g. `85262875094` instead of `+85262875094`)

**Acceptance Criteria:**
- [ ] In `lib/manychat.ts`, after `createSubscriber` returns HTTP 400 with "WhatsApp ID already exists":
  - Extract the `wa_id` value from the error response (strip `+` prefix if needed)
  - Retry `findBySystemField` with `field_name: "wa_id"` and the extracted value
  - If still not found, retry `findBySystemField` with `field_name: "whatsapp_phone"` and phone without `+` prefix
  - Log each attempt with the result
- [ ] Also update the initial `findBySystemField` call to try both `+85262875094` and `85262875094` formats (with and without `+`)
- [ ] If subscriber ID is resolved via any fallback path, proceed to `sendContent` as normal
- [ ] If all lookups fail, log error and return `false`
- [ ] Typecheck passes
- [ ] Test added covering the "already exists" error path that successfully resolves subscriber ID

---

## Amendment: Set phone field when creating ManyChat subscriber (2026-03-31)

### US-020: Set phone field on createSubscriber so findBySystemField works for future lookups

**Description:** As a developer, I want the ManyChat subscriber to have the `phone` field set (in addition to `whatsapp_phone`) when created, so that `findBySystemField` with `field_name=phone` can find the subscriber on subsequent sends.

**Root cause:** Subscribers created with only `whatsapp_phone` have `phone: null`. ManyChat's `findBySystemField` with `field_name=phone` returns a validation error when the phone field is null. By also setting `phone` at creation time, future lookups succeed.

**Acceptance Criteria:**
- [ ] In `lib/manychat.ts` `createSubscriber` call, add `phone: to` alongside `whatsapp_phone: to` in the request body
- [ ] Update the initial `findBySystemField` call to use `field_name: "phone"` (instead of or in addition to `whatsapp_phone`) for the lookup
- [ ] The lookup flow becomes: `findBySystemField(phone)` → if not found → `createSubscriber(phone + whatsapp_phone)` → send
- [ ] The "already exists" fallback from US-019 is still kept as a safety net
- [ ] Typecheck passes
- [ ] Test updated to reflect new phone field in createSubscriber payload
