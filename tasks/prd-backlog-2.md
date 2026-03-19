# PRD: Class Management System — Backlog Features (Batch 2)

## Introduction

This document captures the second batch of feature requests and UI improvements for the class management system. The system is built on Next.js (Vercel), Convex (backend/database/cron/storage), Tailwind CSS, and Twilio for WhatsApp delivery. This PRD covers eight items: two UI removals, one super-admin action, one admin filter, one new schema field with admin UI, one homepage behaviour change, and two terms acceptance page improvements. Stories are ordered by dependency — schema changes first, then backend logic, then UI — so they can be executed sequentially by the Ralph autonomous agent.

---

## Goals

- Remove the unused "Name" field from the admin portal's participant views (list and detail)
- Give super admins the ability to move a participant to a different session of the same class, with an automatic WhatsApp notification
- Let admins filter the class listing by status (active / inactive / all), defaulting to active-only
- Allow super admins to attach an optional payment URL to each class
- Show only purchasable classes (those with a payment URL) on the public homepage, with a direct "Buy Ticket" link
- Improve the terms acceptance flow with an instructional note before submission and a clear success state after submission

---

## User Stories

### US-001: Add `payment_url` field to classes schema
**Description:** As a developer, I need an optional `payment_url` field on the `classes` table so that super admins can associate a purchase link with each class and the homepage can filter on it.

**Acceptance Criteria:**
- [ ] Add `payment_url: v.optional(v.string())` to the `classes` table definition in `convex/schema.ts`
- [ ] Existing class records are unaffected (field is optional/nullable)
- [ ] Typecheck passes

---

### US-002: Backend — Class create and edit mutations support `payment_url`
**Description:** As a developer, I need the class create and edit mutations to accept and persist the optional `payment_url` field so that super admins can set it from the admin portal.

**Acceptance Criteria:**
- [ ] Class create mutation accepts an optional `payment_url` string argument and stores it
- [ ] Class edit/update mutation accepts an optional `payment_url` string argument and updates it
- [ ] Class queries return the `payment_url` field
- [ ] Passing `undefined` or omitting the field leaves it unset (no coercion to empty string)
- [ ] Typecheck passes

---

### US-003: Backend — Query for homepage: classes filtered by `payment_url` presence
**Description:** As a developer, I need a Convex query that returns only active classes that have a `payment_url` defined so that the homepage can display only purchasable classes.

**Acceptance Criteria:**
- [ ] A query (e.g. `classes:listClassesWithPaymentUrl`) returns all classes where `status === "active"` AND `payment_url` is a non-empty string
- [ ] The query returns `class_id`, `name`, `description`, and `payment_url` for each matching class
- [ ] Typecheck passes

---

### US-004: Admin portal — Remove "Name" column from session participant list
**Description:** As an admin, I should not see a "Name" column in the session participant list table because names are not required in the participant model and the column adds visual noise without useful data.

**Acceptance Criteria:**
- [ ] The "Name" column is removed from the participant list table in the admin portal session participant view
- [ ] No other columns are affected
- [ ] Verify in browser using dev-browser skill
- [ ] Typecheck passes

---

### US-005: Admin portal — Remove "Name" field from participant detail view
**Description:** As an admin, I should not see a "Name" field on the participant detail page because it is not a required or reliable field.

**Acceptance Criteria:**
- [ ] The "Name" field (label + value) is removed from the participant detail page
- [ ] All other participant fields remain visible and correctly displayed
- [ ] Verify in browser using dev-browser skill
- [ ] Typecheck passes

---

### US-006: Admin portal — Super admin: Change Session button on participant detail page
**Description:** As a super admin, I want a "Change Session" button on the participant detail page so that I can move a participant to a different available session of the same class and trigger an automatic WhatsApp notification.

**Acceptance Criteria:**
- [ ] The "Change Session" button is visible on the participant detail page **only** when the logged-in admin has the `super_admin` role
- [ ] Regular admins (`regular_admin` role) do NOT see the button
- [ ] Clicking the button opens a session selector (modal or inline panel) listing only sessions of the **same class** as the participant's current session that have `status === "scheduled"` and `quota_used < quota_defined` (i.e. available quota > 0)
- [ ] The selector displays each session's date, time, and location
- [ ] The admin selects a session and confirms the change
- [ ] On confirmation, the existing mutation `participants:changeParticipantSession` is called with the correct arguments
- [ ] A WhatsApp notification is sent to the customer (handled by the existing mutation — no additional code needed)
- [ ] After a successful change, the participant detail page reflects the new session
- [ ] If no eligible sessions are available, the selector shows a message (e.g. "No available sessions for this class") and no action is taken
- [ ] Verify in browser using dev-browser skill
- [ ] Typecheck passes

---

### US-007: Admin portal — Filter class listing by status
**Description:** As an admin, I want a dropdown filter on the class listing page so that I can view active classes, inactive classes, or all classes without scrolling through irrelevant entries.

**Acceptance Criteria:**
- [ ] A dropdown filter with options "Active", "Inactive", and "All" is displayed above the class list
- [ ] The default selection on page load is "Active" — only active classes are shown initially
- [ ] Selecting "Inactive" shows only classes with `status === "inactive"`
- [ ] Selecting "All" shows all classes regardless of status
- [ ] The filter applies immediately on change (no submit button required)
- [ ] Verify in browser using dev-browser skill
- [ ] Typecheck passes

---

### US-008: Admin portal — Payment URL field in class create/edit form (super admin only)
**Description:** As a super admin, I want an optional "Payment URL" text input on the class create and edit forms so that I can attach a purchase link to each class.

**Acceptance Criteria:**
- [ ] The class create form includes an optional "Payment URL" text input field
- [ ] The class edit form includes the same field, pre-filled with the existing `payment_url` value if set
- [ ] The field is **optional** — leaving it blank is valid and saves/updates the class without a payment URL
- [ ] Submitting with a value persists it via the backend mutations (US-002)
- [ ] The field is visible only to super admins; regular admins do not see it on the form
- [ ] Verify in browser using dev-browser skill
- [ ] Typecheck passes

---

### US-009: Homepage — Show only classes with payment URL; display "Buy Ticket" button
**Description:** As a visitor, I want to see only classes that have a payment link on the homepage, with a clear "Buy Ticket" button for each class, so that I can quickly find and purchase a class.

**Acceptance Criteria:**
- [ ] The homepage class listing uses the filtered query (US-003) and shows **only** classes with a defined `payment_url`
- [ ] Classes without a `payment_url` are not shown on the homepage
- [ ] Each displayed class includes a "Buy Ticket" button or link
- [ ] The "Buy Ticket" link opens the class's `payment_url` in a **new tab** (`target="_blank"`, `rel="noopener noreferrer"`)
- [ ] If no classes have a payment URL, the class listing section shows an appropriate empty state (e.g. "No classes available at this time")
- [ ] Verify in browser using dev-browser skill
- [ ] Typecheck passes

---

### US-010: Terms acceptance page — Add instructional wording before submission
**Description:** As a participant, I want to see a clear note on the terms acceptance form before I submit so that I know I will receive a QR code via WhatsApp after confirming.

**Acceptance Criteria:**
- [ ] A visible note is displayed on the terms acceptance form **above** the submit button (and before the submission action)
- [ ] The note reads exactly: _"After confirming your class session and accepting the terms, you will receive a QR code via a WhatsApp message."_
- [ ] The note is visually distinct (e.g. styled as an info callout or italicised paragraph) so it is not missed
- [ ] The note is present on the form at all times, not only after an error
- [ ] Verify in browser using dev-browser skill
- [ ] Typecheck passes

---

### US-011: Terms acceptance page — Success state redesign
**Description:** As a participant, after successfully submitting the terms acceptance form, I want to see a clear confirmation screen (not the original form) so that I know my application is confirmed and can easily access my QR code.

**Acceptance Criteria:**
- [ ] After successful form submission, all form fields and session/terms details are removed from the page
- [ ] A large green tick (✓) icon is displayed prominently
- [ ] The message "Your class application is confirmed" is displayed below the tick
- [ ] If the submission response includes a `participant_id`, display a button labelled "Open your QR Code" that links to `/participant/[participant_id]`
- [ ] If `participant_id` is not available in the response, the button is omitted (graceful degradation — the rest of the success state is still shown)
- [ ] The success state is shown in place of the form without a full page reload (client-side state change)
- [ ] Verify in browser using dev-browser skill
- [ ] Typecheck passes

---

## Functional Requirements

- **FR-1:** The `classes` table schema must include `payment_url: v.optional(v.string())`
- **FR-2:** Class create and edit mutations must accept, store, and return `payment_url`
- **FR-3:** A dedicated query must return only active classes with a non-empty `payment_url` for the homepage
- **FR-4:** The admin participant list table must not include a "Name" column
- **FR-5:** The admin participant detail page must not display a "Name" field
- **FR-6:** The "Change Session" button must be visible exclusively to super admins on the participant detail page
- **FR-7:** The session selector for "Change Session" must list only sessions of the same class with `status === "scheduled"` and available quota (quota_used < quota_defined)
- **FR-8:** Session change must invoke the existing `participants:changeParticipantSession` mutation; no new WhatsApp notification code is required
- **FR-9:** The class listing filter dropdown must default to "Active" on page load
- **FR-10:** The "Payment URL" field on class forms must be visible only to super admins
- **FR-11:** The homepage must only display classes where `payment_url` is defined and non-empty
- **FR-12:** The "Buy Ticket" link must open the payment URL in a new tab with `rel="noopener noreferrer"`
- **FR-13:** The instructional note on the terms acceptance page must appear above the submit button at all times
- **FR-14:** After successful terms acceptance, the form must be replaced with a success state containing a green tick, the confirmation message, and (if available) an "Open your QR Code" button

---

## Non-Goals

- No payment processing — the payment URL is an external link only; no in-app checkout
- No validation of the payment URL format (admin is trusted to enter a valid URL)
- No bulk change of session for multiple participants at once
- No automated WhatsApp notification when `payment_url` is added or removed from a class
- No display of the payment URL on the participant QR code page
- No participant-facing session change within the terms acceptance flow (session is selected once, then confirmed)
- No undo / rollback for session changes performed by super admin
- No rich text or Markdown rendering for the instructional wording on the terms acceptance page

---

## Technical Considerations

- **Schema:** All schema changes are in `convex/schema.ts`; no SQL migrations required. Add `payment_url` field only to the `classes` table definition.
- **Role check for Change Session button:** Reuse the existing admin role/permission logic (check `admins.role === "super_admin"`) — do not introduce a new auth mechanism.
- **Change Session mutation:** `participants:changeParticipantSession` already exists and sends the WhatsApp notification. The new UI only needs to call it with the correct `participantId` and new `sessionId`.
- **Session selector query:** Write a new Convex query (or reuse an existing one) that accepts `class_id` and returns sessions filtered by `status === "scheduled"` and `quota_used < quota_defined`.
- **Homepage query:** The new `classes:listClassesWithPaymentUrl` query can be a simple filter over the existing classes table — no new index is required unless performance demands it.
- **Class listing filter:** The filter can be implemented as client-side state (React `useState`) filtering the already-fetched class list, or as a parameterised query. Client-side filtering is simpler if the class count is small.
- **Payment URL field visibility:** Gate the field on the logged-in admin's role, consistent with how other super-admin-only features are gated in the admin portal.
- **Terms acceptance success state:** The form page should use local React state (e.g. `submitted: boolean`, `participantId: string | null`) to switch between the form view and the success view without a page navigation. The `participant_id` should be captured from the mutation response.
- **Green tick icon:** Use a Tailwind-styled SVG or a heroicons check-circle icon in green (`text-green-500` or similar) at a large size (e.g. `w-24 h-24`).

---

## Open Questions

1. Should the "Change Session" modal/panel include a confirmation step (i.e. "Are you sure you want to move this participant to Session X?") before calling the mutation, or is a single click on the session row sufficient?
2. For the class listing filter, should the selected filter value persist across page navigations (e.g. via URL query param `?status=active`) or is in-memory state sufficient?
3. Should the "Payment URL" field have any basic validation (e.g. must start with `http://` or `https://`) or is any non-empty string accepted?
4. On the homepage, should classes with a `payment_url` still be hidden if the class `status` is `"inactive"`, or should only `payment_url` presence determine visibility? (Current US-003 assumes both `active` status and `payment_url` are required — confirm this is correct.)
5. After the super admin changes a participant's session, should the admin portal immediately navigate back to the participant detail page (showing the new session) or stay on the selector? Assumed: close the selector and refresh the detail view.
6. Is `participant_id` reliably available in the terms acceptance mutation response in all code paths, or only when a single participant is created? (Relevant to the "Open your QR Code" button in US-011.)
