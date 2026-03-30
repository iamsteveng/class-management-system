# PRD: AWS S3 Purchase Ingestion

## Introduction

Integrate the class management system with an AWS S3 bucket to automatically ingest purchase records from CSV files. When a new purchase CSV is detected in the S3 bucket, the system reads it, maps the product ID to the correct class, inserts a purchase record in the database, and triggers a WhatsApp message to the customer for term acceptance.

This is a transitional integration — in the medium term, users will purchase directly through the class management homepage (direct payment gateway). This feature must be designed with that transition in mind, ensuring the purchase creation logic is decoupled from the S3 ingestion trigger.

---

## Goals

- Automatically pick up new purchase CSV files from S3 on a scheduled basis
- Map external product IDs (from the CSV) to internal class IDs (per environment)
- Insert a `purchase` record into the Convex database
- Trigger the existing WhatsApp term acceptance message to the customer
- Move processed files from `{ENV}/new/` to `{ENV}/processed/` after ingestion
- Support dev, uat, and prod environments with different product-to-class mappings
- Prepare the purchase creation logic to be reusable for future direct payment gateway integration

---

## User Stories

### US-001: S3 polling action in Convex
**Description:** As the system, I want to poll S3 for new CSV files so that purchases can be ingested automatically.

**Acceptance Criteria:**
- [ ] A Convex scheduled action (`convex/s3Ingestion.ts`) runs on a configurable interval (default: every 5 minutes)
- [ ] It connects to AWS S3 using credentials from Convex environment variables (`AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_REGION`)
- [ ] It lists files under the key prefix `{ENV}/new/` where `ENV` is read from a Convex environment variable `APP_ENV` (values: `dev`, `uat`, `prod`)
- [ ] S3 bucket name is read from Convex env var `S3_BUCKET_NAME` (default: `mart-order-887306483832-ap-southeast-1-an`)
- [ ] Typecheck passes

### US-002: Product-to-class ID mapping config
**Description:** As a developer, I want a per-environment mapping from product IDs to internal class IDs so that purchase records are linked to the correct class.

**Acceptance Criteria:**
- [ ] A config file `convex/productMapping.ts` exports a mapping object keyed by environment (`dev`, `uat`, `prod`)
- [ ] Each entry maps external product IDs (strings) to internal `class_id` strings
- [ ] The mapping is used during CSV ingestion to resolve `class_id` before inserting the purchase
- [ ] If a product ID is not found in the mapping, the ingestion logs a warning and skips the row (does not crash)
- [ ] Example structure documented in the file with a comment
- [ ] Typecheck passes

### US-003: CSV parsing and purchase insertion
**Description:** As the system, I want to parse a purchase CSV file and insert a purchase record into the database so that the customer can receive the term acceptance message.

**Acceptance Criteria:**
- [ ] CSV files are expected to have these columns (at minimum): `order_id`, `customer_mobile`, `purchase_datetime`, `participant_count`, `product_id`
- [ ] For each valid row, the system calls a shared `createPurchase` Convex mutation (see US-004)
- [ ] Duplicate orders are detected by `order_id` index — if an order already exists, skip it and log a warning
- [ ] `customer_mobile` is normalised to E.164 format (e.g. `+85298765432`) before insertion
- [ ] `participant_count` is parsed as an integer
- [ ] A unique `token` (UUID v4) is generated for each purchase
- [ ] Initial `status` is set to `pending_terms`
- [ ] Typecheck passes

### US-004: Shared `createPurchase` mutation (payment-gateway ready)
**Description:** As a developer, I want a reusable Convex mutation for creating purchases so that both S3 ingestion and the future direct payment gateway can use the same logic.

**Acceptance Criteria:**
- [ ] A Convex mutation `convex/purchases.ts: createPurchase` accepts: `order_id`, `customer_mobile`, `purchase_datetime`, `participant_count`, `class_id` (optional), `source` (`s3` | `payment_gateway`)
- [ ] The mutation generates a UUID `token`, sets `status: "pending_terms"`, and inserts the purchase
- [ ] It returns the new `purchase._id`
- [ ] If `order_id` already exists, it throws a `ConvexError` with message `"duplicate_order"`
- [ ] The `source` field is stored in the purchase record for auditing (add `source` field to schema)
- [ ] Typecheck passes

### US-005: Move processed files in S3
**Description:** As the system, I want to move successfully processed CSV files from `{ENV}/new/` to `{ENV}/processed/` so that they are not reprocessed.

**Acceptance Criteria:**
- [ ] After a file is fully processed (all rows attempted), the file is copied to `{ENV}/processed/{original-filename}` in S3
- [ ] The original file is deleted from `{ENV}/new/`
- [ ] If the copy or delete fails, log the error but do not block future polling
- [ ] Typecheck passes

### US-006: Trigger WhatsApp term acceptance message after purchase creation
**Description:** As the system, I want to send a WhatsApp message to the customer immediately after a purchase record is created so that they can accept terms and select a session.

**Acceptance Criteria:**
- [ ] After `createPurchase` succeeds, the S3 ingestion action calls the existing `purchaseConfirmation:sendPurchaseConfirmation` action with the new `purchase_id`
- [ ] If WhatsApp sending fails, the purchase record remains in the database with `status: "pending_terms"` (not rolled back)
- [ ] Error is logged with `order_id` and error details
- [ ] Typecheck passes

### US-007: Admin UI — S3 ingestion log / manual trigger (optional, stretch)
**Description:** As an admin, I want to see a log of recent S3 ingestion runs and trigger a manual poll so that I can diagnose issues without waiting for the next scheduled run.

**Acceptance Criteria:**
- [ ] Admin page at `/admin/ingestion` shows last 20 ingestion run results (timestamp, files processed, rows inserted, errors)
- [ ] A "Poll Now" button triggers an immediate S3 poll
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

---

## Functional Requirements

- FR-1: S3 polling runs on a schedule (every 5 minutes) via Convex scheduler
- FR-2: AWS credentials (`AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_REGION`) stored in Convex environment variables
- FR-3: S3 bucket and environment prefix are configurable via Convex env vars (`S3_BUCKET_NAME`, `APP_ENV`)
- FR-4: Product-to-class mapping is defined in `convex/productMapping.ts`, keyed by environment
- FR-5: Rows with unknown product IDs are skipped with a warning log (not a hard failure)
- FR-6: Duplicate `order_id` rows are skipped idempotently
- FR-7: `customer_mobile` is normalised to E.164 before storage
- FR-8: Each new purchase triggers `sendPurchaseConfirmation` action (existing WhatsApp flow)
- FR-9: Processed files are moved from `{ENV}/new/` → `{ENV}/processed/`
- FR-10: `createPurchase` mutation is the single source of truth for purchase creation (reusable for payment gateway)
- FR-11: A `source` field is added to the `purchases` schema to track origin (`s3` | `payment_gateway`)

---

## Non-Goals

- No direct payment gateway integration in this feature (future work)
- No retry logic for failed WhatsApp sends (existing behaviour is acceptable for now)
- No CSV file validation beyond required column presence
- No S3 event notification / webhook trigger (polling only for now)
- No UI for managing product-to-class mappings (config file only)
- Admin ingestion log UI (US-007) is stretch — not required for initial delivery

---

## Technical Considerations

- **AWS SDK:** Use `@aws-sdk/client-s3` (v3 modular). Already likely compatible with Convex Node.js actions (`"use node"` directive required).
- **CSV parsing:** Use `csv-parse` (lightweight, well-maintained) or `papaparse`.
- **Convex scheduling:** Use `cronJobs` in `convex/crons.ts` to schedule the polling action.
- **Environment mapping:** `APP_ENV` env var determines which product mapping and S3 prefix to use.
- **Schema change:** Add `source: v.union(v.literal("s3"), v.literal("payment_gateway"))` to `purchases` table. Make it `v.optional` initially for backwards compatibility with existing records.
- **Existing flow reuse:** `sendPurchaseConfirmation` in `convex/purchaseConfirmation.ts` is already implemented and can be called directly after insertion.
- **Product mapping example:**
  ```ts
  // convex/productMapping.ts
  export const productMapping: Record<string, Record<string, string>> = {
    dev:  { "PROD-001": "class_abc", "PROD-002": "class_def" },
    uat:  { "PROD-001": "class_xyz" },
    prod: { "PROD-001": "class_live_001" },
  };
  ```

---

## Success Metrics

- CSV files in `{ENV}/new/` are picked up within 5 minutes of arrival
- 100% of valid rows result in a purchase record + WhatsApp trigger
- Zero duplicate purchase records from reprocessing the same file
- Processed files reliably moved to `{ENV}/processed/`
- Codebase is structured so payment gateway integration can reuse `createPurchase` without changes

---

## Open Questions

1. What are the exact column names in the CSV? (Assumed: `order_id`, `customer_mobile`, `purchase_datetime`, `participant_count`, `product_id` — please confirm or provide a sample file)
2. What is the mobile number format in the CSV? (e.g. `+85298765432`, `85298765432`, `98765432`) — needed for E.164 normalisation logic
3. Should multiple product IDs in a single CSV row be supported, or is it always one product per order?
4. What should happen if the S3 bucket is unreachable (network/auth error)? Silent fail + log, or alert?
5. Is US-007 (Admin ingestion log) needed for the initial release or is it a stretch goal?
