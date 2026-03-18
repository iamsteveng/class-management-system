# PRD: Class Management System — Backlog Features & Bug Fixes

## Introduction

This document captures the full backlog of feature requests and bug fixes for the class management system. The system is built on Next.js (Vercel), Convex (backend/database/cron/storage), Tailwind CSS, and Twilio for WhatsApp delivery. This PRD covers eight items: four bug fixes and four new features. Stories are ordered by dependency — schema changes first, then backend logic, then UI — so they can be executed sequentially by the Ralph autonomous agent.

---

## Goals

- Collect additional participant health/safety information (height, age, emergency contact) during terms acceptance
- Display a Google Maps link on the QR code participant page when a session location link is set
- Fix missing navigation links in the admin portal (session → participant list → participant detail)
- Prevent accidental cancellation of sessions that have enrolled participants
- Restore the missing "Create New Terms Version" page in the admin portal
- Enable QR code attendance scanning directly from a session's participant list page
- Add a public FAQ section to the homepage
- Provide super-admin management of FAQ content in the admin portal

---

## User Stories

### US-001: Add participant extra fields to database schema
**Description:** As a developer, I need to store height, age, emergency contact name, and emergency contact phone number per participant so that these fields persist in the database and are available to both the terms form and the admin portal.

**Acceptance Criteria:**
- [ ] Add `height` (string, optional), `age` (number, optional), `emergencyContactName` (string, optional), `emergencyContactPhone` (string, optional) fields to the participants table/schema in Convex
- [ ] Existing participant records are unaffected (fields are nullable/optional)
- [ ] Typecheck passes

---

### US-002: Add Google Maps URL field to sessions schema
**Description:** As a developer, I need to store an optional Google Maps URL on each session so that it can be displayed on the participant QR code page.

**Acceptance Criteria:**
- [ ] Add `googleMapsUrl` (string, optional) field to the sessions table/schema in Convex
- [ ] Existing session records are unaffected (field is nullable/optional)
- [ ] Typecheck passes

---

### US-003: Add FAQ table to database schema
**Description:** As a developer, I need a database table to store FAQ items (question + answer) so that the homepage and admin portal can read and manage them.

**Acceptance Criteria:**
- [ ] Create a `faqs` table in Convex with fields: `question` (string), `answer` (string), `order` (number, for display ordering), `createdAt` (number), `updatedAt` (number)
- [ ] Typecheck passes

---

### US-004: Backend — Convex mutations/queries for participant extra fields
**Description:** As a developer, I need backend mutations and queries to save and retrieve height, age, emergency contact name, and emergency contact phone number for participants so that both the terms form (write) and admin portal (read) can use them.

**Acceptance Criteria:**
- [ ] The existing participant creation/update mutation accepts and stores `height`, `age`, `emergencyContactName`, `emergencyContactPhone`
- [ ] The participant query returns all four new fields
- [ ] Typecheck passes

---

### US-005: Backend — Convex mutations/queries for session Google Maps URL
**Description:** As a developer, I need the session create/edit mutations to accept and store `googleMapsUrl`, and the session query to return it.

**Acceptance Criteria:**
- [ ] Session create mutation accepts optional `googleMapsUrl`
- [ ] Session edit mutation accepts optional `googleMapsUrl`
- [ ] Session query returns `googleMapsUrl`
- [ ] Typecheck passes

---

### US-006: Backend — Block session cancellation when participants are enrolled
**Description:** As a developer, I need a backend guard that prevents cancelling a session if it has one or more enrolled participants, so data integrity is maintained.

**Acceptance Criteria:**
- [ ] The cancel session mutation checks whether any participant is enrolled in the session
- [ ] If enrolled participants exist, the mutation throws a user-visible error (e.g. "Cannot cancel: session has enrolled participants")
- [ ] If no enrolled participants exist, cancellation proceeds as before
- [ ] Typecheck passes

---

### US-007: Backend — Convex mutations/queries for attendance records
**Description:** As a developer, I need a backend mutation to mark a participant as attended for a session, recording participant ID, session ID, admin username, and timestamp, so the QR code scanning feature can persist attendance data.

**Acceptance Criteria:**
- [ ] Create (or update) an attendance record mutation that accepts `participantId`, `sessionId`, `adminUsername`, `timestamp`
- [ ] Mutation is idempotent (rescanning the same participant does not duplicate records)
- [ ] A query exists to retrieve attendance records for a given session
- [ ] Typecheck passes

---

### US-008: Backend — Convex mutations/queries for FAQ management
**Description:** As a developer, I need CRUD mutations and a list query for FAQ items so that the admin portal can manage them and the homepage can display them.

**Acceptance Criteria:**
- [ ] `createFaq(question, answer, order)` mutation exists
- [ ] `updateFaq(id, question, answer, order)` mutation exists
- [ ] `listFaqs()` query returns all FAQ items sorted by `order` ascending
- [ ] Typecheck passes

---

### US-009: Terms acceptance form — additional participant fields UI
**Description:** As a participant, I want to enter my height, age, and emergency contact details during the terms acceptance form so that the organiser has my safety information on record.

**Acceptance Criteria:**
- [ ] The terms acceptance form includes input fields for: Height, Age (years), Emergency Contact Name, Emergency Contact Phone
- [ ] All four fields are required before form submission is allowed
- [ ] Submitted values are saved to the participant record via the backend mutation (US-004)
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

---

### US-010: Session create/edit form — Google Maps URL field
**Description:** As an admin, I want to optionally enter a Google Maps URL when creating or editing a session so that participants can find the venue easily.

**Acceptance Criteria:**
- [ ] Session create form includes an optional "Google Maps URL" text input
- [ ] Session edit form includes an optional "Google Maps URL" text input pre-filled with existing value
- [ ] Saving persists the value via the backend mutation (US-005)
- [ ] Field is optional — leaving it blank is valid
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

---

### US-011: Admin portal — Fix navigation from session list to participant list
**Description:** As an admin, I want each session row in the sessions list to have a link/button to the participant list for that session so that I can navigate quickly without having to find another route.

**Acceptance Criteria:**
- [ ] Each row in the admin sessions list has a "View Participants" button or link
- [ ] Clicking the button navigates to the participant list page filtered/scoped to that session
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

---

### US-012: Admin portal — Fix navigation from participant list to participant detail
**Description:** As an admin, I want each participant row in the participant list to have a link/button to that participant's detail page so that I can view or edit their information.

**Acceptance Criteria:**
- [ ] Each row in the participant list has a "View" or "Details" button or link
- [ ] Clicking navigates to the participant detail page for that participant
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

---

### US-013: Admin portal — Display participant extra fields on detail view
**Description:** As an admin, I want to see the participant's height, age, emergency contact name, and emergency contact phone number on the participant detail page so that I have all safety information in one place.

**Acceptance Criteria:**
- [ ] Participant detail page displays `height`, `age`, `emergencyContactName`, `emergencyContactPhone`
- [ ] Fields are shown with clear labels
- [ ] If a field is not set, display a placeholder (e.g. "—")
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

---

### US-014: Admin portal — Block cancel session UI with enrolled participants warning
**Description:** As an admin, I want to see a clear error message if I try to cancel a session that already has enrolled participants so that I don't accidentally break participant records.

**Acceptance Criteria:**
- [ ] When the admin clicks "Cancel Session" for a session with enrolled participants, a clear error/warning message is displayed (e.g. "This session has enrolled participants and cannot be cancelled")
- [ ] The session is NOT cancelled
- [ ] If there are no enrolled participants, cancellation proceeds normally
- [ ] Error message is visible inline or as a toast/modal — not a raw browser alert
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

---

### US-015: Admin portal — Create New Terms Version page
**Description:** As an admin, I want a dedicated page to create a new version of the terms content so that new participants are always shown the latest terms.

**Acceptance Criteria:**
- [ ] A "Terms" (or "Create Terms") entry exists in the admin portal navigation menu bar
- [ ] The page includes a rich text or plain textarea for the new terms content
- [ ] Submitting saves a new terms version to the database (via existing or new mutation)
- [ ] New participants see the latest terms version during acceptance
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

---

### US-016: QR code participant page — Display Google Maps link
**Description:** As a participant, I want to see a Google Maps link on my QR code page if the session has a location link set so that I can easily navigate to the venue.

**Acceptance Criteria:**
- [ ] If `googleMapsUrl` is set on the session, the QR code participant page shows a "Get Directions" (or similar) link that opens the Google Maps URL
- [ ] If `googleMapsUrl` is not set, no link is shown (no broken UI)
- [ ] The link opens in a new tab
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

---

### US-017: Admin portal — QR code attendance scanning button
**Description:** As a regular admin, I want a "Scan QR Code" button on the session participant list page so that I can open the device camera and scan participant QR codes to mark attendance.

**Acceptance Criteria:**
- [ ] A "Scan QR Code" button is visible on the session participant list page for regular admins
- [ ] Clicking the button activates the device camera and opens a QR code scanner UI
- [ ] Scanning a valid participant QR code calls the attendance mutation (US-007) with `participantId`, `sessionId`, `adminUsername`, and current timestamp
- [ ] After a successful scan, a green tick (✓) appears in that participant's row immediately (optimistic UI update or reactive query update)
- [ ] Scanning an invalid or unrecognised QR code shows an error message without crashing
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

---

### US-018: Homepage — FAQ section
**Description:** As a visitor, I want to see a FAQ section below the class listing on the homepage so that I can find answers to common questions without contacting support.

**Acceptance Criteria:**
- [ ] The homepage displays a "Frequently Asked Questions" (or equivalent) section below the class listing
- [ ] Each FAQ item shows the question and the answer
- [ ] FAQ items are ordered by the `order` field from the database
- [ ] If there are no FAQ items in the database, the section is not shown (no empty section)
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

---

### US-019: Admin portal — FAQ management page
**Description:** As a super admin, I want a FAQ management page in the admin portal so that I can add and edit FAQ items that appear on the homepage.

**Acceptance Criteria:**
- [ ] A "FAQ" entry exists in the admin portal navigation menu bar
- [ ] The page lists all existing FAQ items with their question and answer
- [ ] Super admins see "Add FAQ" and "Edit" buttons; regular admins can view but cannot add or edit
- [ ] The "Add FAQ" form includes fields for: Question, Answer, Order (numeric)
- [ ] Submitting the add form calls `createFaq` mutation (US-008) and the list updates immediately
- [ ] The "Edit" form pre-fills existing values and calls `updateFaq` mutation (US-008) on submit
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

---

## Functional Requirements

- **FR-1:** Participant schema must include `height` (string, optional), `age` (number, optional), `emergencyContactName` (string, optional), `emergencyContactPhone` (string, optional)
- **FR-2:** Session schema must include `googleMapsUrl` (string, optional)
- **FR-3:** FAQ schema must include `question`, `answer`, `order`, `createdAt`, `updatedAt`
- **FR-4:** Terms acceptance form must collect and persist all four extra participant fields before submission is allowed
- **FR-5:** Session create/edit must include an optional Google Maps URL field that is persisted
- **FR-6:** The cancel session backend mutation must reject cancellation if enrolled participants exist, returning a descriptive error
- **FR-7:** Attendance records must store `participantId`, `sessionId`, `adminUsername`, and `timestamp`; duplicate scans must not create duplicate records
- **FR-8:** Admin sessions list must include a navigation control to each session's participant list
- **FR-9:** Admin participant list must include a navigation control to each participant's detail page
- **FR-10:** Participant detail page must display the four extra fields with appropriate labels and fallback for missing data
- **FR-11:** Admin portal must have a "Create Terms Version" page accessible from the menu bar
- **FR-12:** QR code participant page must show a Google Maps link only when `googleMapsUrl` is set
- **FR-13:** Session participant list page must include a "Scan QR Code" button that activates the device camera for attendance marking
- **FR-14:** Successful QR scan must show a green tick in the participant's row immediately
- **FR-15:** Homepage must display FAQ items below the class listing (hidden if no items exist)
- **FR-16:** Admin FAQ management page must be accessible from the menu bar; only super admins may add or edit items

---

## Non-Goals

- No participant-facing self-service FAQ editing
- No rich text / markdown rendering for FAQ answers (plain text is sufficient unless otherwise specified)
- No bulk import of FAQ items
- No participant height/age/emergency contact validation beyond "required" (no medical ranges enforced)
- No automated WhatsApp notification when terms version changes
- No attendance export or reporting (just marking and display in the UI)
- No QR code scanning history / audit log beyond the attendance record itself
- No support for multiple attendance events per session per participant

---

## Technical Considerations

- **Backend:** All schema changes are Convex table definitions; no SQL migrations required — schema is defined in `convex/schema.ts`
- **Auth:** Admin role checks (super admin vs regular admin) should reuse existing role/permission logic from the admin portal
- **QR scanning:** Use a browser-compatible QR scanning library (e.g. `html5-qrcode` or `@zxing/browser`); must work on mobile device cameras during a live session
- **Optimistic UI for attendance:** Convex's reactive queries will update the participant list automatically after the mutation; no manual polling needed
- **Google Maps URL:** Stored as a plain string; no validation of the URL format beyond basic non-empty check — admin is trusted to enter a valid URL
- **Terms versioning:** The existing terms version system should be extended, not replaced; confirm the current schema before adding the new page (read `convex/schema.ts` first)
- **FAQ ordering:** `order` is a manual integer — no drag-and-drop required; admin enters a number

---

## Open Questions

1. Should `height` be stored as a free-text string (e.g. "175cm", "5'9\"") or as a numeric value in a fixed unit (e.g. centimetres)? Free text is safer for international users but harder to validate.
2. Is `age` entered as a self-reported integer at time of registration, or should we store date of birth and compute age dynamically?
3. For the "Create Terms Version" page — does the admin paste raw text, or should there be a rich text editor? Is Markdown support needed?
4. Should the QR scanner in the attendance flow restrict scanning to participants enrolled in the specific session being viewed, or accept any valid participant QR code?
5. For FAQ display order — should there be a "last updated" timestamp shown to visitors, or is a plain list sufficient?
6. Should regular admins be able to view (read-only) the FAQ management page, or should it be hidden entirely for non-super-admins?
