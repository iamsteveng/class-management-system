# PRD: Bug Fixes — Admin Navigation, Class/Session Actions, Terms Link Hostname

## Introduction

This PRD addresses three critical bugs blocking admin workflow and customer onboarding:

1. **Missing admin navigation:** After login, admins have no persistent menu/navigation to switch between admin pages
2. **Missing action buttons:** Super admins cannot edit or cancel classes/sessions due to absent UI controls
3. **Wrong hostname in terms link:** WhatsApp messages contain terms acceptance URLs with incorrect hostname, preventing customers from accessing the terms page

This is a minimal patch focused on passing acceptance tests and unblocking users.

## Goals

- Provide persistent navigation in admin portal for all authenticated admins
- Restore edit/cancel action buttons for super admin role only
- Ensure terms acceptance links use the correct configured hostname
- Maintain existing role-based access control (regular admins remain view-only)
- Pass all bug-validation acceptance tests

## User Stories

### US-BUG-001: Add persistent admin navigation bar
**Description:** As an admin, I need visible navigation after login so I can switch between admin pages without using the browser back button or manually typing URLs.

**Acceptance Criteria:**
- [ ] After login, a persistent navigation container (header/sidebar/tabs) is visible
- [ ] Navigation includes links to: Dashboard, Classes, Sessions, Participants, Terms
- [ ] Navigation remains visible across all admin pages (does not disappear on route change)
- [ ] Navigation links use accessible labels and proper href values
- [ ] Clicking each link navigates to the correct page without errors
- [ ] Typecheck passes
- [ ] Verify in browser using Playwright test `BUG-TC-001`, `BUG-TC-002`, `BUG-TC-003`, `BUG-TC-004`

### US-BUG-002: Add edit button for classes (super admin only)
**Description:** As a super admin, I need an Edit button on each class row so I can update class name/description when needed.

**Acceptance Criteria:**
- [ ] "Edit" button visible in each class row on `/admin/classes` page
- [ ] Button only visible when logged in as `super_admin` role
- [ ] Button hidden for `regular_admin` role
- [ ] Clicking Edit opens a modal/form with current class data pre-filled
- [ ] Form includes fields: name, description
- [ ] Saving the form updates the class record in the database
- [ ] Updated values display immediately in the class list after save
- [ ] Typecheck passes
- [ ] Verify in browser using Playwright test `BUG-TC-005`, `BUG-TC-006`

### US-BUG-003: Add cancel button for classes (super admin only)
**Description:** As a super admin, I need a Cancel button for each class so I can mark a class as cancelled when it's no longer offered.

**Acceptance Criteria:**
- [ ] "Cancel" button visible in each class row on `/admin/classes` page
- [ ] Button only visible when logged in as `super_admin` role
- [ ] Button hidden for `regular_admin` role
- [ ] Clicking Cancel opens a confirmation dialog: "Are you sure you want to cancel this class?"
- [ ] After confirmation, the system checks if the class has any active future sessions (`session.status !== 'cancelled' AND session.date >= today`)
- [ ] If future sessions exist, show error: "Cannot cancel class with future sessions. Cancel or complete all sessions first."
- [ ] If no future sessions, update `class.status` to `cancelled`
- [ ] Cancelled classes show visual indicator (e.g., strikethrough, badge, grayed-out row)
- [ ] No WhatsApp notifications sent (status change only)
- [ ] Action logged to `audit_logs` table
- [ ] Typecheck passes
- [ ] Verify in browser using Playwright test `BUG-TC-007`

### US-BUG-004: Add edit button for sessions (super admin only)
**Description:** As a super admin, I need an Edit button on each session row so I can update session details when schedules change.

**Acceptance Criteria:**
- [ ] "Edit" button visible in each session row on `/admin/classes/[class_id]/sessions` page
- [ ] Button only visible when logged in as `super_admin` role
- [ ] Button hidden for `regular_admin` role
- [ ] Clicking Edit opens a modal/form with current session data pre-filled
- [ ] Form includes fields: location, date, time, quota_defined
- [ ] Saving the form updates the session record in the database
- [ ] Updated values display immediately in the session list after save
- [ ] Typecheck passes
- [ ] Verify in browser using Playwright test `BUG-TC-008`, `BUG-TC-009`

### US-BUG-005: Add cancel button for sessions (super admin only)
**Description:** As a super admin, I need a Cancel button for each session so I can mark a session as cancelled when it won't occur.

**Acceptance Criteria:**
- [ ] "Cancel" button visible in each session row on `/admin/classes/[class_id]/sessions` page
- [ ] Button only visible when logged in as `super_admin` role
- [ ] Button hidden for `regular_admin` role
- [ ] Clicking Cancel opens a confirmation dialog: "Are you sure you want to cancel this session?"
- [ ] After confirmation, update `session.status` to `cancelled`
- [ ] Cancelled sessions are excluded from the session selector dropdown on terms acceptance page
- [ ] Cancelled sessions show visual indicator in admin session list
- [ ] No WhatsApp notifications sent (status change only)
- [ ] Action logged to `audit_logs` table
- [ ] Typecheck passes
- [ ] Verify in browser using Playwright test `BUG-TC-010`

### US-BUG-006: Fix terms link hostname in WhatsApp messages
**Description:** As a customer, I need the terms acceptance link in WhatsApp to use the correct hostname so I can access the terms page without encountering invalid-host errors.

**Acceptance Criteria:**
- [ ] WhatsApp message generation reads hostname from `APP_BASE_URL` environment variable
- [ ] If `APP_BASE_URL` is not set, throw error at message-send time (fail-fast, do not use hardcoded fallback)
- [ ] Terms link format: `https://{APP_BASE_URL}/terms?token={uuid}`
- [ ] Link must be absolute URL (not relative path)
- [ ] Link must include `token` query parameter with valid purchase token
- [ ] Opening the link in a browser loads the terms acceptance page without redirect or error
- [ ] Hostname in generated link matches the deployed frontend domain
- [ ] Typecheck passes
- [ ] Verify using Playwright tests `BUG-TC-012`, `BUG-TC-013`, `BUG-TC-014`, `BUG-TC-015`

### US-BUG-007: Enforce role-based action visibility
**Description:** As a regular admin, I should NOT see edit/cancel buttons so I understand my view-only access level.

**Acceptance Criteria:**
- [ ] When logged in as `regular_admin`, no Edit or Cancel buttons are visible on classes page
- [ ] When logged in as `regular_admin`, no Edit or Cancel buttons are visible on sessions page
- [ ] When logged in as `super_admin`, all Edit and Cancel buttons are visible
- [ ] Role check happens server-side (not just hidden via CSS)
- [ ] Typecheck passes
- [ ] Verify in browser using Playwright test `BUG-TC-011`

## Functional Requirements

**Navigation:**
- FR-1: Add persistent navigation component to admin layout (header or sidebar)
- FR-2: Navigation must include links to: `/admin/dashboard`, `/admin/classes`, `/admin/sessions/*`, `/admin/sessions/*/participants`, `/admin/terms`
- FR-3: Navigation must remain visible on all admin pages after login
- FR-4: Navigation links must use semantic HTML (`<nav>`, `<a>` with proper hrefs)

**Class Actions:**
- FR-5: Add "Edit" button to each class row on `/admin/classes` for `super_admin` only
- FR-6: Add "Cancel" button to each class row on `/admin/classes` for `super_admin` only
- FR-7: Edit form must update `classes` table fields: `name`, `description`
- FR-8: Cancel action must check for future sessions before allowing cancellation
- FR-9: Cancel action must update `classes.status` to `cancelled`
- FR-10: Edit and Cancel actions must be logged to `audit_logs` table

**Session Actions:**
- FR-11: Add "Edit" button to each session row on session list page for `super_admin` only
- FR-12: Add "Cancel" button to each session row on session list page for `super_admin` only
- FR-13: Edit form must update `sessions` table fields: `location`, `date`, `time`, `quota_defined`
- FR-14: Cancel action must update `sessions.status` to `cancelled`
- FR-15: Cancelled sessions must not appear in the terms acceptance session selector
- FR-16: Edit and Cancel actions must be logged to `audit_logs` table

**Terms Link Hostname:**
- FR-17: WhatsApp message generation must read `APP_BASE_URL` from environment variables
- FR-18: Terms link format must be: `https://{APP_BASE_URL}/terms?token={token}`
- FR-19: If `APP_BASE_URL` is not set, the message send action must throw an error and log to console
- FR-20: Terms link must be absolute URL (include protocol and hostname)

**Role Enforcement:**
- FR-21: `regular_admin` role must NOT see Edit or Cancel buttons for classes or sessions
- FR-22: `super_admin` role must see all Edit and Cancel buttons
- FR-23: Role checks must be enforced server-side in addition to client-side visibility

## Non-Goals (Out of Scope)

- No mobile app navigation changes (web only)
- No WhatsApp notifications when classes/sessions are cancelled (status update only)
- No undo/restore for cancelled classes or sessions
- No batch edit/cancel operations (one-at-a-time only)
- No permission granularity beyond existing super_admin/regular_admin roles
- No historical hostname tracking or migration for old links
- No real-time notification when hostname config changes
- No visual redesign of navigation beyond making it visible

## Design Considerations

**Navigation Component:**
- Use simple header bar with horizontal links or vertical sidebar
- Reuse existing Tailwind classes for consistency
- Active page should have visual indicator (underline, bold, color)
- Mobile-responsive (collapsible menu or stacked links)

**Action Buttons:**
- Use existing button component styles from AddClassModal/AddSessionModal
- Place Edit and Cancel buttons in an "Actions" column at the end of each table row
- Edit button: primary style (blue/zinc-900)
- Cancel button: danger style (red/destructive)
- Confirmation dialogs use native `confirm()` or a modal component

**Role Guards:**
- Wrap Edit/Cancel buttons with conditional rendering: `{session.user.role === 'super_admin' && <button>...}`
- Server-side mutations must also verify role before executing actions

**Hostname Configuration:**
- Store `APP_BASE_URL` in Convex environment variables (already exists per deployment notes)
- Access via `process.env.APP_BASE_URL` in Node.js actions
- Example value: `class-management-system-teal.vercel.app` (no protocol in env var, prepend `https://` in code)

## Technical Considerations

**Navigation Implementation:**
- Add a new component: `components/admin-nav.tsx` or update `app/admin/layout.tsx`
- Use Next.js `<Link>` component for client-side routing
- Consider using `usePathname()` hook to highlight active page

**Edit/Cancel Modals:**
- Reuse modal pattern from `AddClassModal.tsx` and `AddSessionModal.tsx`
- Create `EditClassModal.tsx`, `EditSessionModal.tsx` components
- Pass current record data as props to pre-fill form fields

**Audit Logging:**
- Wrap edit/cancel mutations with audit log writes
- Log format: `{ admin_username, action_type: 'edit_class'|'cancel_class'|'edit_session'|'cancel_session', entity_type, entity_id, changes_json, timestamp }`

**Future Session Check (Class Cancel):**
- Query: `await ctx.db.query("sessions").withIndex("by_class_id", q => q.eq("class_id", classId)).collect()`
- Filter: `sessions.filter(s => s.status !== 'cancelled' && new Date(s.date) >= new Date())`
- If length > 0, reject cancellation

**Hostname Fix:**
- Update `convex/purchaseConfirmation.ts` (or equivalent action)
- Change hardcoded hostname to: `const baseUrl = process.env.APP_BASE_URL || throw new Error("APP_BASE_URL not configured");`
- Build URL: `const termsLink = \`https://\${baseUrl}/terms?token=\${token}\`;`

**Session Status Exclusion:**
- Update terms page session selector query to filter: `.filter(s => s.status !== 'cancelled')`

## Success Metrics

- **Navigation:** Admin can reach any admin page in 1 click from any other admin page
- **Actions:** Super admin can edit/cancel a class or session in under 3 clicks
- **Role guard:** Regular admin sees zero edit/cancel buttons (verified via screenshot/DOM check)
- **Hostname:** 100% of new WhatsApp messages contain correct hostname
- **Acceptance tests:** All BUG-TC-001 through BUG-TC-015 pass

## Open Questions

- Should cancelled classes/sessions be hidden from the main list or just visually marked?
  - **Answer:** Just visually marked (grayed out, badge, or strikethrough)
- Should admins be able to un-cancel (restore) a class/session?
  - **Answer:** No (out of scope for minimal patch)
- What happens if a customer already has a terms link with the wrong hostname?
  - **Answer:** Out of scope; focus on fixing new messages only

## Implementation Notes

This is a **minimal patch** focused on passing acceptance tests. Prioritize:
1. Navigation visibility
2. Button presence + role guards
3. Hostname correctness

Avoid scope creep:
- No refactoring unrelated code
- No visual redesigns beyond making controls visible
- No new features (just fix what's broken)

After implementation, run:
```bash
BASE_URL=https://class-management-system-teal.vercel.app npx playwright test --grep=BUG-TC
```

All 15 BUG-TC-* tests must pass for bug PRD completion.
