# PRD: Class Management System

## Introduction

A full-stack class management system that automates customer onboarding, session booking, and participant management for classes like cycling courses and guided tours. The system processes CSV purchase records, sends WhatsApp confirmations via Twilio, manages session capacity, and provides an admin portal for operations.

**Tech Stack:**
- Frontend: Next.js + Tailwind CSS (hosted on Vercel)
- Backend: Convex.dev (Node.js runtime)
- Database: Convex.dev
- File Storage: Convex.dev
- Cron Jobs: Convex.dev
- WhatsApp: Twilio API

## Goals

- Automate customer confirmation flow from purchase to participation
- Enable self-service session selection and rescheduling
- Provide admins with real-time visibility into session capacity and participant status
- Ensure terms acceptance is captured and auditable
- Reduce manual coordination via automated WhatsApp notifications

## User Stories

### US-001: CSV Purchase Record Import
**Description:** As the system, I need to continuously check for new CSV files and process purchase records so that customers receive timely confirmations.

**Acceptance Criteria:**
- [ ] Convex cron job runs every 1 minute to check file storage for new CSV files
- [ ] Each CSV row parsed with: order_id, customer_mobile, purchase_datetime, participant_count
- [ ] If order_id already exists in database, flag as duplicate error and notify admin (don't process)
- [ ] New records inserted into `purchases` table with status='pending_terms'
- [ ] Successfully processed CSV files marked as processed (don't re-import)
- [ ] Typecheck passes
- [ ] Unit tests for CSV parser with duplicate detection

### US-002: Send Purchase Confirmation WhatsApp
**Description:** As a customer, I want to receive a WhatsApp message immediately after my purchase is processed so I can complete the terms acceptance.

**Acceptance Criteria:**
- [ ] Trigger WhatsApp send after new purchase record is created
- [ ] Message includes: class name, link to terms acceptance form with unique token
- [ ] Link format: `https://[domain]/terms?token=[uuid]`
- [ ] Token stored in database linked to purchase record
- [ ] Twilio API integration sends message to customer_mobile
- [ ] Purchase status updated to 'confirmation_sent'
- [ ] Typecheck passes

### US-003: Terms Acceptance Form Page
**Description:** As a customer, I want to view and accept terms via a simple form without logging in so I can confirm my participation quickly.

**Acceptance Criteria:**
- [ ] Public Next.js page at `/terms?token=[uuid]` loads purchase details
- [ ] Display: class name, customer info, available sessions with quota indicators
- [ ] Session selector dropdown shows only sessions with available_quota > 0
- [ ] Display full terms content (fetched from latest version in DB)
- [ ] Checkbox: "I have read and accept the terms"
- [ ] Submit button disabled until session selected + terms checked
- [ ] On submit: save session selection + timestamp + terms version accepted
- [ ] Update purchase status to 'terms_accepted'
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

### US-004: Generate Participant Records and Send QR Links
**Description:** As a customer, I want to receive WhatsApp messages with unique QR code links for each participant after accepting terms.

**Acceptance Criteria:**
- [ ] After terms submission, create participant records (one per participant_count)
- [ ] Each participant gets unique `participant_id` (UUID)
- [ ] Send WhatsApp message with link(s): `https://[domain]/participant/[participant_id]`
- [ ] If participant_count=2, send one message with two links
- [ ] Each participant record linked to: purchase, selected session, terms version
- [ ] Typecheck passes

### US-005: Participant Details Page with QR Code
**Description:** As a participant, I want to view my class details and show a QR code at the venue for check-in.

**Acceptance Criteria:**
- [ ] Public Next.js page at `/participant/[participant_id]` (no login required)
- [ ] Display: participant name, class name, session (location, date, time)
- [ ] Display: terms acceptance status and accepted terms content
- [ ] Generate and display QR code encoding participant_id
- [ ] If session is >2 days away, show "Change Session" button
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

### US-006: Self-Service Session Rescheduling
**Description:** As a participant, I want to change my session up to 2 days before the scheduled date so I can adjust for conflicts.

**Acceptance Criteria:**
- [ ] "Change Session" button only visible if session_date - current_date > 2 days
- [ ] Click opens modal with dropdown of available sessions (same class, quota > 0)
- [ ] On submit: update participant record with new session_id
- [ ] Decrement old session available_quota, increment new session available_quota
- [ ] Allow unlimited changes as long as 2-day rule is met
- [ ] Show confirmation: "Session changed successfully"
- [ ] No WhatsApp notification sent (this is customer-initiated)
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

### US-007: Admin Login System
**Description:** As an admin, I want to log in with username and password so I can access the management portal.

**Acceptance Criteria:**
- [ ] Next.js login page at `/admin/login`
- [ ] Form fields: username, password
- [ ] Convex auth action validates credentials against `admins` table
- [ ] Store admin role ('super_admin' or 'regular_admin') in session
- [ ] Redirect to `/admin/dashboard` on success
- [ ] Show error message on invalid credentials
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

### US-008: Audit Trail for Admin Actions
**Description:** As a system administrator, I need all admin actions logged so we can audit changes for compliance.

**Acceptance Criteria:**
- [ ] Create `audit_logs` table with: timestamp, admin_username, action_type, entity_type, entity_id, changes_json
- [ ] Wrap all admin mutations with audit logging wrapper
- [ ] Log includes: before/after state for updates, full object for creates/deletes
- [ ] Typecheck passes

### US-009: Admin Class Management
**Description:** As an admin, I want to create, edit, and cancel classes so I can manage our course offerings.

**Acceptance Criteria:**
- [ ] Admin dashboard page at `/admin/classes` lists all classes
- [ ] Columns: class_id, class_name, total_sessions, total_participants, actions
- [ ] "Add Class" button opens modal: name, description (Super Admin only)
- [ ] "Edit" button opens modal: update name/description (Super Admin only)
- [ ] "Cancel" marks class as cancelled (Super Admin only, requires confirmation)
- [ ] Regular admins see read-only view
- [ ] All actions logged to audit_logs with admin_username
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

### US-010: Admin Session Management
**Description:** As an admin, I want to create, edit, and cancel sessions for a class so I can manage capacity and scheduling.

**Acceptance Criteria:**
- [ ] Session list page at `/admin/classes/[class_id]/sessions`
- [ ] Display table: location, date, time, quota (defined/used/available), status, actions
- [ ] "Add Session" button: form with location, date, time, quota (Super Admin only)
- [ ] "Edit" button: update location/date/time/quota (Super Admin only)
- [ ] "Cancel" marks session as cancelled, sends WhatsApp to all participants (Super Admin only)
- [ ] Show quota as: "20 / 15 / 5" (defined=20, used=15, available=5)
- [ ] If available=0, mark as "Full" with red indicator
- [ ] Regular admins see read-only view
- [ ] All actions logged to audit_logs
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

### US-011: View Session Participants
**Description:** As an admin, I want to see all participants in a session so I can prepare for class and verify attendance.

**Acceptance Criteria:**
- [ ] Participant list at `/admin/sessions/[session_id]/participants`
- [ ] Table columns: participant_id, name, mobile, terms_accepted (yes/no), accepted_terms_version, actions
- [ ] Click "View Terms" shows modal with accepted terms content
- [ ] Sort by participant name (default)
- [ ] Export button downloads CSV of participant list (Super Admin only)
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

### US-012: Admin-Initiated Session Change
**Description:** As an admin, I want to move a participant to a different session so I can accommodate special requests.

**Acceptance Criteria:**
- [ ] "Change Session" button in participant row (Super Admin only)
- [ ] Modal shows dropdown of available sessions (same class, quota > 0)
- [ ] On submit: update participant.session_id
- [ ] Update session quotas (decrement old, increment new)
- [ ] Send WhatsApp notification: "Your session has been changed to [new details]"
- [ ] Log action to audit_logs with admin_username and before/after session details
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

### US-013: Terms Version Management
**Description:** As an admin, I want to create new versions of terms so updated policies apply to new participants while preserving old versions for auditing.

**Acceptance Criteria:**
- [ ] Terms management page at `/admin/terms` (Super Admin only)
- [ ] List all terms versions: version_id, created_date, created_by_admin, is_current, actions
- [ ] "Create New Version" button opens editor (textarea or rich text)
- [ ] On save: mark new version as is_current=true, set all others to is_current=false
- [ ] Display: "This version will apply to all new participants after saving"
- [ ] "View" button shows full terms content in read-only modal
- [ ] All participants link to their accepted terms version (never changes after acceptance)
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

### US-014: Terms Acceptance Blocking
**Description:** As the system, I must prevent participants who haven't accepted terms from attending by not generating their QR code.

**Acceptance Criteria:**
- [ ] Participant record created only after terms form submission
- [ ] If customer never submits terms form, no participant records exist (no QR access)
- [ ] Terms acceptance page shows: "You must accept terms to receive your participant QR code"
- [ ] Admin dashboard flags purchases with status='confirmation_sent' (not yet accepted) in red
- [ ] Typecheck passes

## Functional Requirements

**CSV Import & Processing:**
- FR-1: Convex cron job must check file storage every 1 minute for new CSV files
- FR-2: Each CSV must contain: order_id, customer_mobile, purchase_datetime, participant_count (1 or more)
- FR-3: System must reject and flag duplicate order_id as error, notifying Super Admin via internal alert
- FR-4: Successfully processed CSV files must be marked to prevent re-import

**WhatsApp Notifications:**
- FR-5: System must send WhatsApp via Twilio after purchase import with terms acceptance link
- FR-6: System must send WhatsApp with participant QR links (1 or more per purchase) after terms acceptance
- FR-7: System must send WhatsApp notification when admin changes a participant's session
- FR-8: No WhatsApp sent when participant self-reschedules

**Terms & Session Selection:**
- FR-9: Terms acceptance form must display latest terms version from database
- FR-10: Form must require session selection from available sessions (quota > 0 only)
- FR-11: Form must require checkbox confirmation before submit
- FR-12: System must save accepted terms version reference with participant record (immutable)
- FR-13: Participants cannot access QR code page without completing terms acceptance

**Participant QR & Rescheduling:**
- FR-14: Each participant must have unique UUID-based participant_id
- FR-15: QR code must encode participant_id for admin scanning at venue
- FR-16: Participant details page must be public (no login) accessed via unique link
- FR-17: Session change button must only appear if session_date - current_date > 2 days
- FR-18: Participants can reschedule unlimited times within 2-day window
- FR-19: Session change must update quotas (decrement old session, increment new session)

**Admin Portal:**
- FR-20: Admin login with username/password (stored in admins table)
- FR-21: Two roles: 'super_admin' (full access) and 'regular_admin' (view-only for classes, sessions, terms)
- FR-22: All admin actions must log to audit_logs table with: admin_username, timestamp, action_type, before/after state
- FR-23: Super Admins can create/edit/cancel classes
- FR-24: Super Admins can create/edit/cancel sessions
- FR-25: Regular Admins have read-only access to classes and sessions
- FR-26: All admins can view participant lists and participant details
- FR-27: Super Admins can change participant sessions (triggers WhatsApp notification)
- FR-28: Super Admins can create new terms versions; new version applies to all future participants
- FR-29: Session capacity must display as: defined quota / used / available
- FR-30: Sessions at full capacity must show visual indicator and block new bookings

## Non-Goals (Out of Scope)

- No payment processing (purchases handled externally, CSVs are source of truth)
- No email notifications (WhatsApp only via Twilio)
- No customer login system (participants identified by unique UUID links)
- No mobile app (responsive web only)
- No multi-language support (English only)
- No refund processing (handled externally)
- No session waitlist (if full, customer must pick another session)
- No recurring/subscription classes (each purchase is one-time)
- No real-time inventory sync with external systems (CSV is only source)

## Design Considerations

**UI/UX:**
- Mobile-first responsive design (customers primarily access via WhatsApp on mobile)
- QR codes must be large enough to scan from phone screen at 1-2 meters
- Admin dashboard optimized for desktop/tablet
- Use Tailwind color-coded status indicators (red=full, yellow=low quota, green=available)
- Confirmation dialogs for destructive actions (cancel session, cancel class)

**Components to Build:**
- SessionSelector dropdown with quota display
- QRCodeDisplay component (use qrcode library)
- AuditLog table with filtering
- AdminRoleGuard wrapper for Super Admin-only actions
- WhatsAppButton component for send/preview flows

## Technical Considerations

**Convex Schema Design:**
```
purchases: { order_id, customer_mobile, purchase_datetime, participant_count, status, token, class_id, terms_version_accepted, session_id, created_at }

participants: { participant_id (UUID), purchase_id, session_id, name, mobile, qr_code_data, terms_accepted_at, terms_version_id, created_at }

classes: { class_id, class_name, description, status (active/cancelled), created_at, created_by_admin }

sessions: { session_id, class_id, location, date, time, quota_defined, quota_used, status (active/cancelled/full), created_at }

terms_versions: { version_id, content (text), is_current (boolean), created_at, created_by_admin }

admins: { admin_id, username, password_hash, role (super_admin/regular_admin), created_at }

audit_logs: { log_id, admin_username, timestamp, action_type, entity_type, entity_id, changes_json }

csv_files: { file_id, filename, processed (boolean), processed_at, error_message }
```

**Convex Cron Jobs:**
- CSV import job: runs every 1 minute
- Check for expired terms acceptance links (optional cleanup)

**Twilio Integration:**
- Store Twilio credentials in Convex environment variables
- Use Twilio Node.js SDK in Convex actions
- Message template stored as constants (easy to update copy)

**Performance:**
- Index on purchases.order_id for duplicate detection
- Index on participants.participant_id for QR lookup
- Index on sessions.date for filtering upcoming sessions
- Paginate admin tables (50 records per page)

**Security:**
- Participant links use UUID v4 (cryptographically random, non-guessable)
- Admin passwords hashed with bcrypt (min 10 rounds)
- Rate limit login attempts (5 failures = 15-minute lockout)
- Convex auth middleware enforces admin session validation
- CORS configured for Vercel domain only

## Success Metrics

- 95%+ of customers complete terms acceptance within 24 hours of purchase
- Zero manual WhatsApp sends required (full automation)
- Admin can view session roster in under 3 clicks
- Session rescheduling rate <10% (indicates good initial session selection)
- Zero duplicate order_id imports processed (error detection works)
- All admin actions auditable within 2 clicks from any entity

## Open Questions

- Should we send a reminder WhatsApp if customer doesn't accept terms within 24 hours?
- Do we need SMS fallback if WhatsApp delivery fails?
- Should session cancellation by admin offer automatic rebooking to another session?
- How long should we retain audit logs? (30 days? 1 year? indefinitely?)
- Should QR codes expire after session date, or remain accessible for record-keeping?
