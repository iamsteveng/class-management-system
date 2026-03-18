# Test Plan: Class Management System Backlog

## Source

- PRD: `tasks/prd-backlog.md`
- Schema: `convex/schema.ts`
- App routes inspected: `app/` directory (Next.js)
- Generated: 2026-03-18

---

## Scope

This test plan covers all 19 user stories from the Class Management System backlog PRD, spanning:

- Participant extra fields (height, age, emergency contact) — US-001, US-004, US-009, US-013
- Session Google Maps URL — US-002, US-005, US-010, US-016
- FAQ management and display — US-003, US-008, US-018, US-019
- Admin navigation fixes — US-011, US-012
- Cancel session guard — US-006, US-014
- Terms version management — US-015
- Attendance QR scanning — US-007, US-017

Test levels: end-to-end (e2e) browser tests via Playwright against the running Next.js + Convex application.

---

## Out of Scope

- Unit tests for individual Convex mutations/queries (covered by Convex typecheck)
- WhatsApp delivery (Twilio integration)
- Bulk FAQ import
- Attendance export / reporting
- QR scanner behaviour on physical devices (camera hardware)
- Medical validation of height/age values
- Rich text / Markdown rendering for FAQ answers
- Drag-and-drop FAQ ordering

---

## Assumptions and Ambiguities

1. **Height format** — stored as free text (e.g. "175cm"); no numeric range validation is enforced.
2. **Age** — stored as a self-reported integer at registration; no date-of-birth computation.
3. **Terms content** — plain textarea assumed; rich text not required per non-goals.
4. **QR scanner scope** — unclear whether scanner restricts to session-enrolled participants; plan tests both valid and unrecognised QR codes.
5. **Regular admin FAQ access** — PRD states view-only; assumed the page is accessible but Add/Edit controls are hidden.
6. **Super admin detection** — reuses existing `role: "super_admin"` field in `admins` table.
7. **Attendance idempotency** — re-scanning the same participant should not create duplicate records (US-007 AC).
8. **Google Maps URL validation** — no format validation beyond non-empty; admin is trusted.
9. **Test environment** — local dev stack (`npm run dev` + Convex dev) with seeded test data.

---

## Risk Areas

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Terms form validation skippable via direct API call | Low | High | Test backend rejection as well as UI |
| Cancel session guard race condition (concurrent enrollments) | Low | High | Test optimistic locking / error surfacing in UI |
| QR scanner camera permissions on headless Playwright | Medium | Medium | Mock camera / inject QR data via API in CI; real device test in staging |
| Convex reactive queries fail to update attendance row in time | Medium | High | Add explicit wait/assertion for green tick |
| Super-admin role check missing on FAQ edit endpoint | Medium | High | Test both role types against the FAQ mutation |
| Google Maps URL persisting correctly through session edit | Low | Medium | Round-trip test: save → reload → verify |
| FAQ section hidden when items exist (wrong condition) | Low | Medium | Seed at least one FAQ item before homepage test |
| Navigation links (View Participants, participant detail) broken after route refactor | Medium | High | Explicit URL assertion after click |

---

## Scenario Matrix

| ID | Source | Level | Scenario | Steps | Expected Result | Evidence | Priority |
|---|---|---|---|---|---|---|---|
| TC-001 | US-009 | e2e | Terms form — submit with all extra fields populated | 1. Navigate to `/terms?token=<valid>` 2. Fill name, mobile, height, age, emergency contact name, emergency contact phone 3. Accept terms 4. Submit | Form submits successfully; participant record contains all four extra fields | Screenshot of success state; Convex record assertion | P0 |
| TC-002 | US-009 | e2e | Terms form — submit with missing required extra field (height omitted) | 1. Navigate to `/terms?token=<valid>` 2. Fill name, mobile, age, emergency contact fields; leave height blank 3. Attempt to submit | Form shows validation error for height; submission is blocked | Screenshot of error state | P0 |
| TC-003 | US-009 | e2e | Terms form — submit with all extra fields missing | 1. Navigate to `/terms?token=<valid>` 2. Fill only name and mobile 3. Attempt to submit | Form shows validation errors for all four missing fields | Screenshot of error messages | P1 |
| TC-004 | US-010 | e2e | Admin session create — save with Google Maps URL | 1. Log in as admin 2. Navigate to session create form 3. Fill all required fields and enter a valid Google Maps URL 4. Save | Session is created; Google Maps URL is persisted (visible on edit form reload) | Screenshot of saved session; edit form pre-fill assertion | P0 |
| TC-005 | US-010 | e2e | Admin session create — save without Google Maps URL (optional field) | 1. Log in as admin 2. Navigate to session create form 3. Fill all required fields; leave Google Maps URL blank 4. Save | Session is created successfully; no error; `google_maps_url` is null/absent | Screenshot of created session | P0 |
| TC-006 | US-010 | e2e | Admin session edit — update Google Maps URL on existing session | 1. Log in as admin 2. Open edit modal for existing session without a Maps URL 3. Enter a Google Maps URL 4. Save 5. Reload edit form | Google Maps URL field is pre-filled with the entered value | Screenshot of pre-filled edit form | P1 |
| TC-007 | US-016 | e2e | QR code participant page — shows Maps link when URL is set | 1. Ensure session has `google_maps_url` set 2. Navigate to `/participant/<participant_id>` for a participant in that session | "Get Directions" (or equivalent) link is visible and href matches the stored URL | Screenshot of link element | P0 |
| TC-008 | US-016 | e2e | QR code participant page — no Maps link when URL is not set | 1. Ensure session has no `google_maps_url` 2. Navigate to `/participant/<participant_id>` | No directions link is rendered; page shows cleanly without broken elements | Screenshot of participant page | P0 |
| TC-009 | US-016 | e2e | QR code participant page — Maps link opens in new tab | 1. Session has `google_maps_url` set 2. Navigate to participant QR page 3. Inspect the directions link | Link has `target="_blank"` attribute | DOM attribute assertion | P1 |
| TC-010 | US-011 | e2e | Admin session list — "View Participants" button navigates to participant list | 1. Log in as admin 2. Navigate to `/admin/sessions` 3. Locate a session row 4. Click "View Participants" | Browser navigates to `/admin/sessions/<session_id>/participants` | URL assertion; page heading visible | P0 |
| TC-011 | US-012 | e2e | Admin participant list — clicking row navigates to participant detail | 1. Log in as admin 2. Navigate to a session's participant list 3. Click on a participant row | Browser navigates to `/admin/participants/<participant_id>` | URL assertion; participant name visible on detail page | P0 |
| TC-012 | US-014 | e2e | Admin cancel session — blocked when participants are enrolled | 1. Log in as admin 2. Navigate to a session that has enrolled participants 3. Click "Cancel Session" | Error/warning message is displayed ("This session has enrolled participants and cannot be cancelled" or equivalent); session status remains "scheduled" | Screenshot of error message; session status assertion | P0 |
| TC-013 | US-014 | e2e | Admin cancel session — allowed when no participants enrolled | 1. Log in as admin 2. Navigate to a session with zero participants 3. Click "Cancel Session" 4. Confirm | Session status changes to "cancelled"; no error shown | Screenshot of cancelled status | P0 |
| TC-014 | US-014 | e2e | Admin cancel session — error displayed inline (not raw browser alert) | 1. Log in as admin 2. Try to cancel a session with enrolled participants | Error message appears in page UI (inline or toast/modal), not as a raw `window.alert` | Screenshot; no `alert` dialog intercepted | P1 |
| TC-015 | US-015 | e2e | Admin terms — "Terms" menu entry is visible and navigates to page | 1. Log in as admin 2. Inspect admin navigation bar | "Terms" (or "Create Terms") link is visible 3. Click it → navigates to `/admin/terms` | Screenshot of nav; URL assertion | P1 |
| TC-016 | US-015 | e2e | Admin terms — creating a new terms version makes it current | 1. Log in as admin 2. Navigate to `/admin/terms` 3. Enter new terms content 4. Submit | New terms version saved; `is_current = true` for new version; previous version `is_current = false` | Assertion on `terms_versions` table via Convex dev dashboard or API | P0 |
| TC-017 | US-015 | e2e | Admin terms — new participant sees latest terms version | 1. Create a new terms version (TC-016) 2. Open terms acceptance form for a new token | Terms content displayed matches the newly created version | Screenshot of terms text | P1 |
| TC-018 | US-017 | e2e | Attendance scanning — successful QR scan marks participant attended with green tick | 1. Log in as admin 2. Navigate to `/admin/sessions/<session_id>/participants` 3. Click "Scan QR Code" 4. Scan (or inject) a valid participant QR code for the session | Attendance record created; green tick (✓) appears in the participant's row without page reload | Screenshot of green tick; attendance record assertion | P0 |
| TC-019 | US-017 | e2e | Attendance scanning — scanning unknown QR shows error | 1. Log in as admin 2. Navigate to session participant list 3. Click "Scan QR Code" 4. Inject/scan an unrecognised QR string | Error message shown in scanner UI; no crash; no attendance record created | Screenshot of error message | P1 |
| TC-020 | US-017 | e2e | Attendance scanning — re-scanning same participant is idempotent | 1. Log in as admin 2. Scan valid participant QR code (TC-018) 3. Scan the same QR code again | No duplicate attendance record created; no crash; green tick remains | Attendance record count assertion (count = 1) | P1 |
| TC-021 | US-013 | e2e | Admin participant detail — shows height, age, emergency contact | 1. Ensure a participant has height, age, emergency contact name and phone recorded 2. Log in as admin 3. Navigate to `/admin/participants/<participant_id>` | Page displays all four fields with clear labels; no raw JSON or undefined shown | Screenshot of detail page | P0 |
| TC-022 | US-013 | e2e | Admin participant detail — shows placeholder for unset extra fields | 1. Navigate to detail page for a participant with no extra fields set | Each missing field shows a placeholder (e.g. "—") instead of blank/undefined | Screenshot of placeholder values | P1 |
| TC-023 | US-018 | e2e | Homepage — FAQ section visible when items exist | 1. Seed at least one FAQ item in the database 2. Load the homepage `/` | "Frequently Asked Questions" (or equivalent) section is visible below the class listing; at least one Q&A item is shown | Screenshot of FAQ section | P0 |
| TC-024 | US-018 | e2e | Homepage — FAQ section hidden when no items exist | 1. Ensure no FAQ items are in the database 2. Load the homepage `/` | No FAQ section is rendered; no empty/blank FAQ container visible | Screenshot of homepage without FAQ section | P1 |
| TC-025 | US-018 | e2e | Homepage — FAQ items ordered by `order` field | 1. Seed multiple FAQ items with distinct `order` values 2. Load homepage | FAQ items appear in ascending `order` value sequence | Screenshot; DOM order assertion | P2 |
| TC-026 | US-019 | e2e | Admin FAQ — "FAQ" menu entry navigates to management page | 1. Log in as super admin 2. Inspect admin navigation bar | "FAQ" link is visible 3. Click → navigates to `/admin/faq` | Screenshot of nav; URL assertion | P1 |
| TC-027 | US-019 | e2e | Admin FAQ — super admin can add new FAQ item | 1. Log in as super admin 2. Navigate to `/admin/faq` 3. Click "Add FAQ" 4. Enter question, answer, order 5. Submit | New FAQ item appears in the list immediately; item is also visible on homepage | Screenshot of updated list; homepage assertion | P0 |
| TC-028 | US-019 | e2e | Admin FAQ — super admin can edit existing FAQ item | 1. Log in as super admin 2. Navigate to `/admin/faq` 3. Click "Edit" on an existing item 4. Change the answer text 5. Submit | Updated answer is shown in the list; change reflected on homepage | Screenshot of updated item | P0 |
| TC-029 | US-019 | e2e | Regular admin cannot add or edit FAQ items | 1. Log in as regular admin 2. Navigate to `/admin/faq` | Page loads (view-only); "Add FAQ" and "Edit" buttons are NOT visible | Screenshot showing absent buttons | P0 |
| TC-030 | US-009 | e2e | Terms form — emergency contact phone accepts valid international format | 1. Navigate to `/terms?token=<valid>` 2. Enter phone in international format (e.g. "+447700900000") 3. Submit with all other fields filled | Form accepts the value and submission succeeds | Screenshot of success | P2 |
| TC-031 | US-007 | e2e | Attendance record — contains correct adminUsername and timestamp | 1. Log in as admin (username: "testadmin") 2. Scan valid participant QR 3. Inspect attendance record | Record contains `marked_by_admin` matching the logged-in admin ID; `marked_at` is a recent timestamp | Attendance record field assertions | P1 |
| TC-032 | US-006 | e2e | Cancel session backend guard — direct mutation call rejected when participants enrolled | 1. Obtain a session ID with enrolled participants 2. Call cancel session mutation directly (via Convex dashboard or test harness) | Mutation throws error with descriptive message; session is not cancelled | Error message text assertion | P1 |

---

## Execution Strategy

1. **Environment:** Local dev (`npm run dev`) with Convex dev deployment. Seed data loaded before test run.
2. **Test framework:** Playwright (TypeScript); each test uses `--grep "TC-XXX"` tag matching.
3. **Seeding:** Dedicated setup fixtures create: one super admin, one regular admin, sessions with/without participants, one session with Google Maps URL, one without. FAQ items seeded/cleared per suite.
4. **Camera mock:** Playwright's `--browser-args` to grant camera permissions; inject QR data via `page.evaluate` or use `jsQR` mock injection to simulate successful/failed scans.
5. **Parallelism:** P0 tests run in series (shared Convex dev instance); P1/P2 can be parallelised with isolated test data.
6. **CI gate:** All P0 tests must pass before merge to `main`. P1/P2 failures are non-blocking warnings.

---

## Entry/Exit Criteria

### Entry Criteria

- [ ] `npm run dev` starts without errors
- [ ] Convex dev deployment is running and schema is up to date
- [ ] Test seed data script executes successfully
- [ ] All P0 user stories are marked "built" (PRD checklist ticked)

### Exit Criteria

- [ ] All 32 test cases executed
- [ ] All P0 tests pass (TC-001, TC-002, TC-004, TC-005, TC-007, TC-008, TC-010, TC-011, TC-012, TC-013, TC-016, TC-018, TC-021, TC-023, TC-027, TC-028, TC-029)
- [ ] No P1 test fails with a severity > minor
- [ ] Screenshot evidence captured for all P0 tests
- [ ] Test results committed to `tasks/qa-results/`

---

## Evidence Requirements

| Type | Required For | Format |
|---|---|---|
| Screenshot (pass) | All P0 tests | PNG, named `TC-XXX-pass.png` |
| Screenshot (fail) | Any failing test | PNG, named `TC-XXX-fail.png` |
| Convex record assertion | TC-001, TC-016, TC-018, TC-020, TC-031, TC-032 | JSON excerpt in test output |
| URL assertion | TC-010, TC-011, TC-015, TC-026 | Playwright `expect(page).toHaveURL(...)` log |
| DOM attribute assertion | TC-009, TC-025 | Playwright assertion output |
| Console error log | TC-019, TC-032 | Terminal output capture |

---

## Traceability

| Test Case | User Story | Functional Requirement |
|---|---|---|
| TC-001 | US-009 | FR-4 |
| TC-002 | US-009 | FR-4 |
| TC-003 | US-009 | FR-4 |
| TC-004 | US-010 | FR-5 |
| TC-005 | US-010 | FR-5 |
| TC-006 | US-010 | FR-5 |
| TC-007 | US-016 | FR-12 |
| TC-008 | US-016 | FR-12 |
| TC-009 | US-016 | FR-12 |
| TC-010 | US-011 | FR-8 |
| TC-011 | US-012 | FR-9 |
| TC-012 | US-014, US-006 | FR-6 |
| TC-013 | US-014, US-006 | FR-6 |
| TC-014 | US-014 | FR-6 |
| TC-015 | US-015 | FR-11 |
| TC-016 | US-015 | FR-11 |
| TC-017 | US-015 | FR-11 |
| TC-018 | US-017, US-007 | FR-13, FR-14 |
| TC-019 | US-017 | FR-13 |
| TC-020 | US-007, US-017 | FR-7 |
| TC-021 | US-013 | FR-10 |
| TC-022 | US-013 | FR-10 |
| TC-023 | US-018 | FR-15 |
| TC-024 | US-018 | FR-15 |
| TC-025 | US-018 | FR-15 |
| TC-026 | US-019 | FR-16 |
| TC-027 | US-019 | FR-16 |
| TC-028 | US-019 | FR-16 |
| TC-029 | US-019 | FR-16 |
| TC-030 | US-009 | FR-4 |
| TC-031 | US-007 | FR-7 |
| TC-032 | US-006 | FR-6 |
