# Test Plan: Bug Fix Validation — Admin Navigation, Class/Session Actions, Terms Link Hostname

## Source

- **Mode:** Objective-based
- **Objective Type:** bug
- **Objective:** Validate fixes for 3 reported bugs:
  1. No menu/navigation in admin portal after login
  2. No admin buttons for edit/cancel class and session
  3. Terms acceptance link in WhatsApp uses wrong hostname
- **Generated on:** 2026-03-05

## Scope

In-scope validation targets:
- Admin portal post-login navigation and page switching UX
- Admin action visibility and functionality for class/session edit + cancel
- WhatsApp message hostname correctness for terms acceptance links
- Role-based behavior for super_admin vs regular_admin where applicable

## Out of Scope

- New feature development outside the 3 bugs
- Performance/load testing
- UI redesign beyond required bug fixes
- Twilio delivery reliability outside URL content correctness

## Assumptions and Ambiguities

- **A-001:** "menu bars" means visible persistent navigation (header/sidebar/tabs) with links to key admin pages.
  - Assumed fix expectation: at least Dashboard, Classes, Sessions, Participants, Terms (or equivalent IA).
  - Impact if wrong: navigation test may be too strict.

- **A-002:** "there is no button for admin to edit, cancel class and session" applies primarily to super_admin role.
  - Assumed behavior: regular_admin may remain read-only per product rules.
  - Impact if wrong: role-permission assertions may need revision.

- **A-003:** Correct hostname for terms link should match deployed frontend base URL.
  - Assumed expected host: `class-management-system-teal.vercel.app` (or configured APP_BASE_URL at runtime).
  - Impact if wrong: URL-host assertion target changes.

- **A-004:** Cancel actions should require confirmation and result in visible status change.
  - Assumed expected statuses: class/session transitions to cancelled/inactive equivalent.
  - Impact if wrong: status checks must be adapted to actual enum.

## Risk Areas

- Missing/partial navigation can block access to otherwise working pages.
- Admin action buttons may render but not trigger mutations/audit logs.
- Hostname bug may be environment-dependent (local/dev/prod config mismatch).
- UI text/selector instability may cause false negatives in E2E.

## Scenario Matrix

| ID | Source | Level | Scenario | Steps | Expected Result | Evidence | Priority |
|---|---|---|---|---|---|---|---|
| TC-001 | BUG-ADMIN-NAV | e2e | Admin sees persistent navigation after login | 1) Login as super_admin 2) Land on admin area 3) Check for visible nav/menu container | Navigation/menu is visible post-login | Screenshot + DOM locator dump | P0 |
| TC-002 | BUG-ADMIN-NAV | e2e | Navigation contains links to key admin pages | 1) Login 2) Inspect nav links 3) Verify expected destinations | Links exist for core admin pages (dashboard/classes/sessions/participants/terms or equivalent) | Screenshot + href list | P0 |
| TC-003 | BUG-ADMIN-NAV | e2e | Navigation switches pages successfully | 1) Login 2) Click each nav item 3) Verify page heading/url updates | Each link routes to correct page without error | URL + heading assertions | P0 |
| TC-004 | BUG-ADMIN-NAV | e2e | Navigation persists across page transitions | 1) Login 2) Open classes 3) Open sessions 4) Return dashboard | Nav remains visible and usable on all pages | Multi-page screenshot set | P1 |
| TC-005 | BUG-CLASS-ACTIONS | e2e | Super admin sees Edit and Cancel for classes | 1) Login as super_admin 2) Open classes list 3) Check row actions | Edit and Cancel buttons are visible for class rows | Screenshot + locator checks | P0 |
| TC-006 | BUG-CLASS-ACTIONS | e2e | Super admin can edit class | 1) Open class edit 2) Change name/description 3) Save | Updated values persist and display in list/detail | Before/after UI + DB/query proof | P0 |
| TC-007 | BUG-CLASS-ACTIONS | e2e | Super admin can cancel class | 1) Click Cancel 2) Confirm action 3) Refresh list | Class status becomes cancelled/inactive and action logged | UI status + audit log evidence | P0 |
| TC-008 | BUG-SESSION-ACTIONS | e2e | Super admin sees Edit and Cancel for sessions | 1) Login super_admin 2) Open class sessions page 3) Check action column | Edit and Cancel buttons visible on sessions | Screenshot + locator checks | P0 |
| TC-009 | BUG-SESSION-ACTIONS | e2e | Super admin can edit session | 1) Edit location/date/time/quota 2) Save 3) Re-open page | Session shows updated values | Before/after UI + DB/query proof | P0 |
| TC-010 | BUG-SESSION-ACTIONS | e2e | Super admin can cancel session | 1) Click Cancel 2) Confirm 3) Validate status | Session marked cancelled and unavailable for new selection | UI status + session selector verification | P0 |
| TC-011 | BUG-ROLE-GUARD | e2e | Regular admin cannot edit/cancel class/session | 1) Login as regular_admin 2) Open classes/sessions 3) Inspect actions | Edit/Cancel hidden or disabled for regular_admin | Screenshot + role-based assertions | P1 |
| TC-012 | BUG-TERMS-HOST | integration | Terms link hostname in WhatsApp uses configured app host | 1) Seed purchase 2) Trigger confirmation message 3) Capture message body | Terms URL host matches APP_BASE_URL/frontend domain | Message payload capture | P0 |
| TC-013 | BUG-TERMS-HOST | integration | Terms link is absolute URL and tokenized | 1) Trigger message 2) Parse URL 3) Validate query params | URL is absolute, includes `token=<uuid>` | Regex parse output | P0 |
| TC-014 | BUG-TERMS-HOST | e2e | Clicked terms link loads valid page for that token | 1) Open sent URL 2) Validate terms page and purchase context | Terms page loads without invalid-host redirect/error | Browser screenshot + URL assertion | P0 |
| TC-015 | BUG-TERMS-HOST | integration | Hostname regression guard across environments | 1) Set env host 2) Trigger message in test context 3) Assert host | Message host always derives from runtime config, not hardcoded example host | Env/value assertion logs | P1 |

## Execution Strategy

1. **Phase 1 (P0 blockers)**
   - Run TC-001..003, TC-005..010, TC-012..014 first.
   - Goal: confirm critical user-facing fixes are functional.

2. **Phase 2 (permission + regression guards)**
   - Run TC-004, TC-011, TC-015.
   - Goal: prevent role/security regressions and hostname rebreaks.

3. **Automation preference**
   - E2E: Playwright against deployed environment.
   - Integration: Convex + Twilio payload inspection/mocks.

## Entry/Exit Criteria

- **Entry**
  - Fixes deployed to testable environment
  - Admin seed users exist (super_admin, regular_admin)
  - WhatsApp send path reachable (or mock capture enabled)

- **Exit (Pass Gate)**
  - All P0 tests pass
  - No unresolved failures in nav/actions/hostname objective
  - Evidence attached for each scenario

## Evidence Requirements

- Screenshots for navigation/action visibility and state changes
- Captured message payload (or mock) containing terms URL
- URL parsing output proving hostname + token correctness
- Optional DB/audit query snapshots for edit/cancel actions

## Traceability

- Bug 1 (admin menu/navigation): TC-001, TC-002, TC-003, TC-004
- Bug 2 (edit/cancel class & session actions): TC-005, TC-006, TC-007, TC-008, TC-009, TC-010, TC-011
- Bug 3 (terms link wrong hostname): TC-012, TC-013, TC-014, TC-015

## Objective Strategy

**Type:** `bug`

Strategy applied:
1. **Reproduce** current bug behavior (missing nav/actions, wrong URL host)
2. **Isolate** by role/context/environment (super_admin vs regular_admin, env hostname)
3. **Verify fix** with deterministic assertions (UI + payload parsing)
4. **Guard regressions** with role and environment-specific checks
