# Test Plan: AWS S3 Purchase Ingestion

## Source

- **PRD:** `tasks/prd-s3-purchase-ingestion.md`
- **Branch:** `feature/prd-s3-purchase-ingestion`
- **PR:** #9

---

## Scope

- S3 polling scheduled action (`convex/s3Ingestion.ts`, `convex/crons.ts`)
- S3 error detection and `ingestion_runs` logging
- Product-to-class ID mapping (`convex/productMapping.ts`)
- CSV parsing: column extraction, whitespace trimming, filename timestamp parsing
- `createPurchase` mutation: insertion, token generation, idempotency, `source` field
- File lifecycle: move from `{ENV}/new/` → `{ENV}/processed/`
- WhatsApp trigger after purchase creation
- `ingestion_runs` table: schema and run record writing
- Admin ingestion UI: `/admin/ingestion`, run history table, Poll Now button (super_admin only)

---

## Out of Scope

- Direct payment gateway integration (future work)
- Retry logic for failed WhatsApp sends
- S3 event notification / webhook trigger
- UI for managing product-to-class mappings
- CSV file format validation beyond required column presence
- Partial row rollback

---

## Assumptions and Ambiguities

**A-001** — Test environment Convex env vars (`AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_REGION`, `S3_BUCKET_NAME`, `APP_ENV`) must be configured before running integration tests. Assumed: a `dev` environment with a mock or real S3 bucket is available for integration tests; unit tests mock the AWS SDK.

**A-002** — "Polling continues on next tick" (US-002) is not directly testable via a timer in unit tests. Assumed: verified by confirming the action does not throw/crash and the scheduler is not deregistered after an error.

**A-003** — WhatsApp sending (US-007) calls an external Twilio API. Assumed: mocked in unit/integration tests; manual e2e test required for live verification.

**A-004** — The `super_admin` role check in the admin UI is based on the existing `adminAuth` context. Assumed: test users with `role: "super_admin"` and `role: "regular_admin"` can both be set up in test fixtures.

**A-005** — "Typecheck passes" is verified by running `npx tsc --noEmit` in the project root. Not listed as a separate test case per story; verified once as TC-001.

**A-006** — CSV sample format confirmed: `order_id, product_id, user_phone, qty, unit_price, total` with space after each comma. Whitespace trimming is required and tested explicitly.

---

## Risk Areas

- **Idempotency (US-005):** Reprocessing the same file must not create duplicate purchase records. High risk if the composite key check (`order_id` + `class_id`) is incomplete.
- **Filename timestamp parsing (US-004):** Malformed filenames (no leading timestamp) must fall back gracefully.
- **Multi-row same order_id (US-004):** One order with two products must produce two separate purchase records, not one.
- **File move failure (US-006):** If `CopyObject` succeeds but `DeleteObject` fails, the file will be reprocessed — idempotency is the only guard.
- **super_admin gate (US-009):** Regular admins must not be able to trigger Poll Now even via direct API calls.

---

## Scenario Matrix

| ID | Source | Level | Scenario | Steps | Expected Result | Evidence | Priority |
|----|--------|-------|----------|-------|-----------------|----------|----------|
| TC-001 | All | unit | TypeScript typecheck passes | Run `npx tsc --noEmit` in project root | Zero type errors | Exit code 0, no stderr | P0 |
| TC-002 | US-001, FR-1 | unit | S3 polling cron is registered at 5-minute interval | Inspect `convex/crons.ts` | `crons.interval` call with `{ minutes: 5 }` pointing to `s3Ingestion:pollS3ForNewFiles` | Source code assertion | P0 |
| TC-003 | US-001, FR-2 | unit | S3 client reads credentials from env vars | Mock `process.env` with test credentials; call `createS3Client()` | S3Client constructed with provided `accessKeyId`, `secretAccessKey`, `region` | Assert S3Client constructor args | P0 |
| TC-004 | US-001, FR-3 | unit | File prefix uses `{APP_ENV}/new/` | Set `APP_ENV=uat`; call `getAppEnv()` and verify prefix | Prefix is `uat/new/` | Assert string value | P0 |
| TC-005 | US-001 | unit | `"use node"` directive present in s3Ingestion.ts | Read file contents | First line is `"use node";` | Source code assertion | P0 |
| TC-006 | US-002, FR-11 | unit | S3 ListObjectsV2 network failure writes error run record | Mock S3 `ListObjectsV2` to throw network error; invoke `pollS3ForNewFiles` | `ingestion_runs` record created with `status: "error"`, `error_message` containing error text | Assert DB record fields | P0 |
| TC-007 | US-002 | unit | S3 auth failure (403) writes error run record | Mock S3 to return `AccessDenied` error | `ingestion_runs` record with `status: "error"`; error_message includes "AccessDenied" | Assert DB record | P0 |
| TC-008 | US-002 | unit | S3 error does not crash scheduler (action returns cleanly) | Mock S3 to throw; invoke action | Action resolves without throwing; no unhandled rejection | Assert no exception thrown | P0 |
| TC-009 | US-003, FR-4 | unit | `resolveClassId` returns correct class_id for known product | Call `resolveClassId("dev", "3")` with mapping `{ dev: { "3": "class_dev_001" } }` | Returns `"class_dev_001"` | Assert return value | P1 |
| TC-010 | US-003 | unit | `resolveClassId` returns undefined for unknown product | Call `resolveClassId("dev", "999")` | Returns `undefined` | Assert return value | P1 |
| TC-011 | US-003 | unit | `resolveClassId` returns undefined for unknown environment | Call `resolveClassId("staging", "3")` | Returns `undefined` | Assert return value | P1 |
| TC-012 | US-003 | unit | Unknown product ID causes row skip with warning log | Mock S3 with CSV containing unknown product_id; invoke ingestion | Row skipped; console.warn called with product_id; no purchase inserted | Assert warning log + zero DB inserts | P0 |
| TC-013 | US-004, FR-8 | unit | CSV values with leading/trailing whitespace are trimmed | Parse CSV row `" 36 , 3 , +85254304789 , 1 , 100.0000 , 100.0000"` | `order_id="36"`, `product_id="3"`, `user_phone="+85254304789"`, `qty=1` | Assert parsed field values | P0 |
| TC-014 | US-004 | unit | `qty` is stored as integer `participant_count` | Parse row with `qty="2"`; call `createPurchase` | `participant_count=2` (integer) in DB record | Assert DB field type and value | P0 |
| TC-015 | US-004, FR-8 | unit | `user_phone` stored as-is (E.164 format) | Parse row with `user_phone="+85254304789"` | `customer_mobile="+85254304789"` in purchase record | Assert DB field value | P1 |
| TC-016 | US-004, FR-5, FR-6 | unit | Two rows with same order_id but different product_id produce two purchase records | Mock CSV with two rows: `order_id=36, product_id=3` and `order_id=36, product_id=5` (both mapped) | Two separate purchase records inserted with different `class_id` values | Assert DB record count = 2 | P0 |
| TC-017 | US-004 | unit | Filename timestamp parsed correctly | Call `parseDatetimeFromFilename("202603271622---abc.csv")` | Returns `"2026-03-27T16:22:00"` | Assert return value | P0 |
| TC-018 | US-004 | unit | Malformed filename (no leading timestamp) falls back to current time | Call `parseDatetimeFromFilename("no-timestamp-file.csv")` | Returns a valid ISO string (current time fallback); does not throw | Assert no exception; assert string matches ISO pattern | P1 |
| TC-019 | US-004 | unit | Filename with directory prefix still parses correctly | Call `parseDatetimeFromFilename("dev/new/202603271622---abc.csv")` | Returns `"2026-03-27T16:22:00"` | Assert return value | P1 |
| TC-020 | US-005, FR-12 | unit | `createPurchase` inserts purchase with correct fields | Call mutation with valid args | DB record has: `order_id`, `customer_mobile`, `participant_count`, `class_id`, `source="s3"`, `status="pending_terms"`, `token` (UUID), `purchase_datetime` | Assert all DB fields | P0 |
| TC-021 | US-005 | unit | `createPurchase` generates unique UUID token | Call mutation twice with different `order_id` | Both records have non-empty, distinct `token` strings | Assert tokens are UUID v4 format and different | P0 |
| TC-022 | US-005, FR-7 | unit | Duplicate `order_id` + `class_id` returns existing `_id` without inserting new record | Insert purchase; call `createPurchase` again with same `order_id` + `class_id` | Returns same `_id`; DB still has exactly one record for that combination | Assert return value equals existing `_id`; assert record count = 1 | P0 |
| TC-023 | US-005, FR-6 | unit | Same `order_id` with different `class_id` is NOT treated as duplicate | Insert purchase for `order_id=36, class_id=class_a`; insert again for `order_id=36, class_id=class_b` | Two distinct records in DB | Assert record count = 2 | P0 |
| TC-024 | US-005, FR-13 | unit | `source` field stored correctly for S3 ingestion | Call `createPurchase` with `source="s3"` | DB record has `source="s3"` | Assert DB field | P1 |
| TC-025 | US-005 | unit | `createPurchase` accepts `source="payment_gateway"` (future readiness) | Call mutation with `source="payment_gateway"` | Insertion succeeds; DB record has `source="payment_gateway"` | Assert no error; assert DB field | P1 |
| TC-026 | US-006, FR-10 | integration | Processed file copied to `{ENV}/processed/` | Mock S3; process a file; assert CopyObject called | S3 `CopyObjectCommand` called with destination key `{ENV}/processed/{filename}` | Assert mock called with correct args | P0 |
| TC-027 | US-006 | integration | Original file deleted from `{ENV}/new/` after copy | Mock S3; process a file | S3 `DeleteObjectCommand` called with source key `{ENV}/new/{filename}` | Assert mock called | P0 |
| TC-028 | US-006 | integration | Copy failure is logged but does not halt polling | Mock `CopyObject` to throw; process file | Error logged; polling continues; no exception propagated | Assert warning log; assert no throw | P1 |
| TC-029 | US-006 | integration | File reprocessed after failed move does not create duplicate (idempotency guard) | Process same file twice (simulate failed move); both rows have same `order_id`+`class_id` | Only one purchase record in DB after second run | Assert record count = 1 | P0 |
| TC-030 | US-007, FR-9 | unit | `sendPurchaseConfirmation` called after successful `createPurchase` | Mock `sendPurchaseConfirmation`; process valid CSV row | Mock called once with the new `purchase_id` | Assert mock call count and args | P0 |
| TC-031 | US-007 | unit | WhatsApp send failure does not roll back purchase record | Mock `sendPurchaseConfirmation` to throw; process valid CSV row | Purchase record exists in DB with `status="pending_terms"`; error logged with `order_id` | Assert DB record exists; assert error log | P0 |
| TC-032 | US-008, FR-11 | unit | Successful poll writes `ingestion_runs` record with `status="success"` | Process CSV with all valid rows | `ingestion_runs` record: `status="success"`, `files_processed=1`, `rows_inserted=N`, `rows_skipped=0` | Assert DB record fields | P0 |
| TC-033 | US-008 | unit | Partial poll (some rows skipped) writes `status="partial"` | Process CSV where one row has unknown product_id | `ingestion_runs` record: `status="partial"`, `rows_inserted>0`, `rows_skipped>0` | Assert DB record fields | P1 |
| TC-034 | US-008 | unit | Empty S3 bucket (no files) writes `status="success"` with zero counts | Mock ListObjectsV2 to return empty list | `ingestion_runs` record: `status="success"`, `files_processed=0`, `rows_inserted=0` | Assert DB record | P2 |
| TC-035 | US-009 | e2e/manual | Admin ingestion page renders for regular admin | Log in as `regular_admin`; navigate to `/admin/ingestion` | Page loads; run history table visible; **Poll Now button not visible** | Screenshot; DOM assertion | P0 |
| TC-036 | US-009 | e2e/manual | Admin ingestion page shows Poll Now button for super_admin | Log in as `super_admin`; navigate to `/admin/ingestion` | Page loads; Poll Now button visible and clickable | Screenshot; DOM assertion | P0 |
| TC-037 | US-009 | e2e/manual | Run history table shows last 20 runs with correct columns | Seed 25 `ingestion_runs` records; navigate to `/admin/ingestion` as any admin | Table shows exactly 20 rows; columns: timestamp, status, files processed, rows inserted, rows skipped, error message | Row count assertion; column header check | P1 |
| TC-038 | US-009 | e2e/manual | Status badges are colour-coded correctly | Seed runs with each status; open page | success=green, partial=yellow, error=red | Screenshot colour check | P1 |
| TC-039 | US-009 | e2e/manual | Poll Now triggers immediate ingestion action | Log in as `super_admin`; click Poll Now; wait | New `ingestion_runs` record appears in table within 10 seconds | DB record timestamp; table refresh | P1 |
| TC-040 | US-009 | e2e/manual | Ingestion page linked from admin nav | Log in as any admin; inspect admin nav | Link to `/admin/ingestion` present in nav | DOM assertion | P2 |

---

## Execution Strategy

### Unit tests (TC-001 to TC-034)
- Framework: **Vitest** (already used in project)
- AWS SDK calls mocked via `vi.mock("@aws-sdk/client-s3")`
- Convex mutations/queries mocked via test utilities in `packages/test-utils`
- Run with: `pnpm test` or `pnpm --filter @claw/... test`
- All unit tests must pass before PR merge

### Integration tests (TC-026 to TC-029)
- Use a local mock S3 (e.g. `@aws-sdk/client-s3` with mock transport) or a real dev S3 bucket
- Require `APP_ENV=dev`, `S3_BUCKET_NAME`, AWS credentials in env

### E2E / Manual tests (TC-035 to TC-040)
- Run against a deployed Convex dev environment
- Use browser with test admin accounts for both `super_admin` and `regular_admin` roles
- Verify using dev-browser skill or manual browser walkthrough
- Required before merge for P0 scenarios (TC-035, TC-036)

---

## Entry/Exit Criteria

### Entry Criteria
- Feature branch `feature/prd-s3-purchase-ingestion` is deployed to dev Convex environment
- Convex env vars set: `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_REGION`, `S3_BUCKET_NAME`, `APP_ENV=dev`
- At least one entry in `convex/productMapping.ts` for the `dev` environment
- Test admin accounts available with both `super_admin` and `regular_admin` roles

### Exit Criteria
- All P0 test cases pass
- All P1 test cases pass or have documented waiver
- TypeScript typecheck (`TC-001`) passes with zero errors
- No duplicate purchase records observed during reprocessing test (`TC-029`)
- PR approved and ready to merge

---

## Evidence Requirements

- **Unit tests:** Vitest output showing all tests pass (exit code 0)
- **TC-022, TC-029 (idempotency):** DB record count assertion in test output
- **TC-035, TC-036 (super_admin gate):** Screenshots showing presence/absence of Poll Now button per role
- **TC-031 (WhatsApp failure):** Log output showing error with `order_id` and purchase record still in DB

---

## Traceability

| Test Case | User Story | Functional Requirement |
|-----------|-----------|----------------------|
| TC-001 | All | All |
| TC-002 | US-001 | FR-1 |
| TC-003 | US-001 | FR-2 |
| TC-004 | US-001 | FR-3 |
| TC-005 | US-001 | — |
| TC-006 | US-002 | FR-11 |
| TC-007 | US-002 | FR-11 |
| TC-008 | US-002 | FR-11 |
| TC-009 | US-003 | FR-4 |
| TC-010 | US-003 | FR-4 |
| TC-011 | US-003 | FR-4 |
| TC-012 | US-003 | FR-4 |
| TC-013 | US-004 | FR-8 |
| TC-014 | US-004 | FR-8 |
| TC-015 | US-004 | FR-8 |
| TC-016 | US-004 | FR-5, FR-6 |
| TC-017 | US-004 | — |
| TC-018 | US-004 | — |
| TC-019 | US-004 | — |
| TC-020 | US-005 | FR-12, FR-13 |
| TC-021 | US-005 | FR-12 |
| TC-022 | US-005 | FR-7 |
| TC-023 | US-005 | FR-6, FR-7 |
| TC-024 | US-005 | FR-13 |
| TC-025 | US-005 | FR-12, FR-13 |
| TC-026 | US-006 | FR-10 |
| TC-027 | US-006 | FR-10 |
| TC-028 | US-006 | FR-10 |
| TC-029 | US-006 | FR-7, FR-10 |
| TC-030 | US-007 | FR-9 |
| TC-031 | US-007 | FR-9 |
| TC-032 | US-008 | FR-11 |
| TC-033 | US-008 | FR-11 |
| TC-034 | US-008 | FR-11 |
| TC-035 | US-009 | FR-14 |
| TC-036 | US-009 | FR-14 |
| TC-037 | US-009 | FR-14 |
| TC-038 | US-009 | FR-14 |
| TC-039 | US-009 | FR-14 |
| TC-040 | US-009 | FR-14 |
