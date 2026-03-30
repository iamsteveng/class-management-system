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
- [ ] A Convex mutation `convex/purchases.ts: createPurchase` accepts: `order_id` (string), `customer_mobile` (string), `participant_count` (number), `class_id` (optional string), `source` (`"s3"` | `"payment_gateway"`), `unit_price` (optional number), `total_price` (optional number)
- [ ] The mutation generates a UUID v4 `token`, sets `status: "pending_terms"`, and inserts the purchase
- [ ] It returns the new `purchase._id`
- [ ] `purchase_datetime` is set to the current timestamp at insertion time
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
**Description:** As an admin, I want to see a log of recent S3 ingestion runs and trigger a manual poll so that I can diagnose issues without waiting for the next scheduled run.

**Acceptance Criteria:**
- [ ] New admin page at `/admin/ingestion`
- [ ] Page shows a table of the last 20 ingestion runs with columns: timestamp, status (with colour: green=success, yellow=partial, red=error), files processed, rows inserted, rows skipped, error message
- [ ] A "Poll Now" button triggers an immediate S3 poll (calls the ingestion action directly)
- [ ] Page is linked from the admin nav
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

1. Should the `purchase_datetime` use the file creation timestamp (from the filename, e.g. `202603271622`) or the current time at insertion? The filename appears to encode `YYYYMMDDHHM` — if so, this could be parsed as the order time.
2. For the admin "Poll Now" button — should it be restricted to specific admin roles, or is any logged-in admin allowed?
