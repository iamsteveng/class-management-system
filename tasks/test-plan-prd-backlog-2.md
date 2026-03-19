# Test Plan: Class Management System Backlog 2

## Source

- **PRD:** `tasks/prd-backlog-2.md` — Class Management System Backlog Features (Batch 2)
- **User Stories:** US-001 through US-011
- **Generated:** 2026-03-19

---

## Scope

This test plan covers all functional changes introduced in Backlog 2:

1. **Homepage class filtering** — only classes with a `payment_url` are displayed, with a "Buy Ticket" button (US-003, US-009)
2. **Payment URL admin field** — super admin can set/edit `payment_url` on class forms; regular admin cannot see the field (US-001, US-002, US-008)
3. **Class listing status filter** — admin class listing defaults to "Active"; filter can switch to Inactive/All (US-007)
4. **Participant list/detail — Name removal** — "Name" column removed from participant list; "Name" field removed from participant detail (US-004, US-005)
5. **Change Session (super admin)** — super admin sees "Change Session" button on participant detail; regular admin does not; selector shows only eligible sessions; mutation fires and WhatsApp notification is sent (US-006)
6. **Terms acceptance page improvements** — instructional wording about QR code WhatsApp shown before submit; success state shows green tick, confirmation message, and "Open your QR Code" button (US-010, US-011)

---

## Out of Scope

- Payment processing or in-app checkout
- WhatsApp message delivery verification end-to-end (carrier/Twilio integration)
- `payment_url` format validation (US says any non-empty string is accepted)
- Bulk session changes for multiple participants
- Rollback/undo of session changes
- Participant QR code page content
- Schema migration correctness (handled by Convex schema typecheck, not E2E)
- URL persistence of class listing filter (URL query param) — open question in PRD; not yet committed

---

## Assumptions and Ambiguities

| # | Assumption / Ambiguity | Impact |
|---|----------------------|--------|
| A1 | Homepage query (`listClassesWithPaymentUrl`) requires both `status === "active"` AND non-empty `payment_url` (PRD US-003 OQ-4) | TC-001, TC-003 |
| A2 | Role check for "Change Session" and "Payment URL" field uses `admins.role === "super_admin"` — existing mechanism | TC-004, TC-005, TC-010, TC-011 |
| A3 | "Change Session" selector lists sessions with `status === "scheduled"` and `quota_used < quota_defined` (quota > 0) | TC-012, TC-013 |
| A4 | `participant_id` is reliably available in mutation response for the "Open your QR Code" button (PRD OQ-6 assumed yes) | TC-016, TC-017 |
| A5 | Success state is a client-side React state change — no full page reload | TC-018 |
| A6 | "Change Session" confirmation step assumed present before calling mutation (PRD OQ-1 assumed yes) | TC-012 |
| A7 | Class listing filter is client-side state (not URL param) unless explicitly implemented otherwise | TC-006, TC-007 |

---

## Risk Areas

| Risk | Severity | Mitigation |
|------|----------|------------|
| Role leakage — regular admin sees super-admin-only UI | High | Explicit P0 tests for both roles (TC-005, TC-011) |
| Homepage accidentally showing classes without `payment_url` | High | TC-001 seeds DB with mixed classes and verifies only filtered ones appear |
| Change Session selector showing full/inactive sessions | High | TC-013 verifies quota=0 sessions are excluded |
| Success state not replacing form fields (form stays visible) | Medium | TC-018 checks form fields absent after submit |
| "Open your QR Code" link points to wrong participant | Medium | TC-017 verifies URL contains correct `participant_id` |
| WhatsApp notification not triggered on session change | Medium | TC-019 verifies audit log or function call |
| Terms instructional note absent from page | Medium | TC-014 asserts exact wording present |

---

## Scenario Matrix

| ID | Source | Level | Scenario | Steps | Expected Result | Evidence | Priority |
|----|--------|-------|----------|-------|-----------------|----------|----------|
| TC-001 | US-003, US-009 | e2e | Homepage only shows classes WITH payment_url | 1. Seed DB: Class A (payment_url set), Class B (no payment_url), both active. 2. Navigate to homepage. 3. Inspect class listing. | Only Class A is displayed. Class B is absent. | Screenshot of homepage class listing | P0 |
| TC-002 | US-009 | e2e | "Buy Ticket" button opens payment_url in new tab | 1. Navigate to homepage with at least one class with payment_url. 2. Click "Buy Ticket" button. | New browser tab opens to the class's payment_url. Link has target="_blank" and rel="noopener noreferrer". | Screenshot of new tab URL + DOM inspection of anchor attributes | P0 |
| TC-003 | US-003, US-009 | e2e | Homepage shows empty state when no classes have payment_url | 1. Ensure no active classes with payment_url exist. 2. Navigate to homepage. | Class listing section shows empty state message (e.g. "No classes available at this time"). No class cards rendered. | Screenshot of homepage empty state | P1 |
| TC-004 | US-008 | e2e | Super admin sees payment URL field in class edit form | 1. Log in as super_admin. 2. Navigate to class edit page. | "Payment URL" input field is visible on the form. | Screenshot of class edit form showing Payment URL field | P0 |
| TC-005 | US-008 | e2e | Regular admin does NOT see payment URL field | 1. Log in as regular_admin. 2. Navigate to class edit page. | "Payment URL" input field is absent from the form. | Screenshot of class edit form — no Payment URL field | P1 |
| TC-006 | US-007 | e2e | Class listing defaults to "Active" filter on page load | 1. Ensure both active and inactive classes exist. 2. Log in as admin. 3. Navigate to class listing page. | Filter dropdown shows "Active" selected. Only active classes are displayed. | Screenshot of class listing with Active filter and class count | P0 |
| TC-007 | US-007 | e2e | Class listing filter switches to Inactive and All | 1. Log in as admin. Navigate to class listing. 2. Select "Inactive" from filter dropdown. 3. Select "All" from filter dropdown. | Step 2: Only inactive classes shown. Step 3: All classes shown regardless of status. Filter applies immediately without page reload. | Screenshots of listing after each filter change | P1 |
| TC-008 | US-004 | e2e | Participant list does NOT show "Name" column | 1. Log in as admin. 2. Navigate to a session's participant list. | "Name" column header and its data cells are absent from the participant table. Other columns remain intact. | Screenshot of participant list table | P0 |
| TC-009 | US-005 | e2e | Participant detail does NOT show "Name" field | 1. Log in as admin. 2. Navigate to a participant detail page. | No "Name" label or value is rendered on the detail page. All other participant fields are present. | Screenshot of participant detail page | P0 |
| TC-010 | US-006 | e2e | Super admin sees "Change Session" button on participant detail | 1. Log in as super_admin. 2. Navigate to a participant detail page. | "Change Session" button is visible on the page. | Screenshot of participant detail with Change Session button | P0 |
| TC-011 | US-006 | e2e | Regular admin does NOT see "Change Session" button | 1. Log in as regular_admin. 2. Navigate to a participant detail page. | "Change Session" button is absent from the page. | Screenshot of participant detail — no Change Session button | P0 |
| TC-012 | US-006 | e2e | Change Session selector shows only eligible sessions (same class, quota > 0, scheduled) | 1. Log in as super_admin. 2. Navigate to participant detail. 3. Click "Change Session". | Selector lists only sessions belonging to the same class, with status "scheduled" and quota_used < quota_defined. Session date, time, and location shown. | Screenshot of Change Session selector with session list | P0 |
| TC-013 | US-006 | e2e | Change Session selector excludes full sessions (quota = 0) | 1. Seed a session of the same class with quota_used = quota_defined (full). 2. Log in as super_admin, open Change Session selector for a participant. | The full session does NOT appear in the selector. Only sessions with available quota are listed. | Screenshot of selector — full session absent | P1 |
| TC-014 | US-010 | e2e | Terms page shows instructional wording about QR code WhatsApp | 1. Navigate to terms acceptance page (as participant). | Visible note reads exactly: "After confirming your class session and accepting the terms, you will receive a QR code via a WhatsApp message." Note appears above the submit button. | Screenshot of terms form with instructional note | P0 |
| TC-015 | US-011 | e2e | Terms success state shows green tick and confirmation message | 1. Navigate to terms acceptance page. 2. Complete and submit the form successfully. | Page displays a large green tick icon and the text "Your class application is confirmed". | Screenshot of success state | P0 |
| TC-016 | US-011 | e2e | Terms success state shows "Open your QR Code" button | 1. Navigate to terms acceptance page. 2. Complete and submit the form successfully (mutation returns participant_id). | "Open your QR Code" button is visible on the success state. | Screenshot of success state with QR Code button | P0 |
| TC-017 | US-011 | e2e | "Open your QR Code" links to correct /participant/[participant_id] | 1. Submit terms form successfully. 2. Inspect or click "Open your QR Code" button. | Button href is `/participant/[participant_id]` where `participant_id` matches the one returned by the mutation. | DOM inspection or navigation to correct URL | P1 |
| TC-018 | US-011 | e2e | Terms success state removes form fields after submission | 1. Submit terms form successfully. 2. Inspect page content. | All form fields, input elements, and session/terms detail blocks are absent. Success state (tick + message + button) is shown in their place. No full page reload occurred. | Screenshot showing form absent, success state present | P1 |
| TC-019 | US-006 | integration | Change Session sends WhatsApp notification | 1. Log in as super_admin. 2. Change a participant's session via the "Change Session" flow. 3. Check audit log or verify `participants:changeParticipantSession` mutation was invoked. | Audit log records a WhatsApp notification event, OR Convex function log confirms `changeParticipantSession` was called (which internally sends notification). | Convex dashboard function log screenshot or audit record | P2 |

---

## Execution Strategy

### Environment
- **Target environment:** Staging (Vercel preview deploy + Convex staging environment)
- **Test runner:** Playwright (E2E) + Convex integration tests for TC-019
- **Auth:** Use seeded test accounts for `super_admin` and `regular_admin` roles

### Approach
1. **Seed data** before each relevant test using Convex test mutations or fixtures: classes with/without `payment_url`, sessions with varying quota states, participants.
2. **Run P0 tests first.** All P0s must pass before proceeding to P1/P2.
3. **Role-based tests** (TC-004/TC-005, TC-010/TC-011) must be run back-to-back with separate auth contexts to catch role leakage.
4. **TC-019** is an integration-level test — verify via Convex function logs rather than a live WhatsApp message.
5. **Cleanup:** Restore seed data or use isolated test sessions to avoid cross-test contamination.

### Test Order (recommended)
P0 → P1 → P2: TC-001, TC-002, TC-004, TC-006, TC-008, TC-009, TC-010, TC-011, TC-012, TC-014, TC-015, TC-016, TC-003, TC-005, TC-007, TC-013, TC-017, TC-018, TC-019

---

## Entry/Exit Criteria

### Entry Criteria
- [ ] Backlog 2 features are deployed to staging
- [ ] Convex schema typecheck passes
- [ ] Test accounts (super_admin, regular_admin) exist in staging
- [ ] Seed data scripts are available and functional
- [ ] Playwright configured and able to reach staging URL

### Exit Criteria
- [ ] All P0 tests pass (0 failures permitted)
- [ ] All P1 tests pass or have approved waivers with documented rationale
- [ ] P2 tests attempted; failures noted in test report
- [ ] All evidence artifacts captured and stored
- [ ] No open role-leakage defects (TC-005, TC-011)

---

## Evidence Requirements

| Evidence Type | Required For | Format |
|--------------|-------------|--------|
| Screenshot — homepage class listing | TC-001, TC-002, TC-003 | PNG, full page |
| DOM inspection — anchor attributes | TC-002 | Screenshot or HTML snippet |
| Screenshot — class edit form (super admin) | TC-004 | PNG |
| Screenshot — class edit form (regular admin) | TC-005 | PNG |
| Screenshot — class listing with filter | TC-006, TC-007 | PNG per filter state |
| Screenshot — participant list table | TC-008 | PNG |
| Screenshot — participant detail page | TC-009, TC-010, TC-011 | PNG |
| Screenshot — Change Session selector | TC-012, TC-013 | PNG |
| Screenshot — terms form with note | TC-014 | PNG |
| Screenshot — success state | TC-015, TC-016, TC-018 | PNG |
| DOM inspection or URL check | TC-017 | Screenshot or log |
| Convex function log / audit record | TC-019 | Screenshot of Convex dashboard |

All artifacts should be named `[TC-ID]-[descriptor].png` and attached to the test report.

---

## Traceability

| Test ID | User Story | Functional Requirement |
|---------|-----------|----------------------|
| TC-001 | US-003, US-009 | FR-3, FR-11 |
| TC-002 | US-009 | FR-12 |
| TC-003 | US-003, US-009 | FR-3, FR-11 |
| TC-004 | US-008 | FR-10 |
| TC-005 | US-008 | FR-10 |
| TC-006 | US-007 | FR-9 |
| TC-007 | US-007 | FR-9 |
| TC-008 | US-004 | FR-4 |
| TC-009 | US-005 | FR-5 |
| TC-010 | US-006 | FR-6 |
| TC-011 | US-006 | FR-6 |
| TC-012 | US-006 | FR-7, FR-8 |
| TC-013 | US-006 | FR-7 |
| TC-014 | US-010 | FR-13 |
| TC-015 | US-011 | FR-14 |
| TC-016 | US-011 | FR-14 |
| TC-017 | US-011 | FR-14 |
| TC-018 | US-011 | FR-14 |
| TC-019 | US-006 | FR-8 |
