# Test Plan: Class Management System

## Source

**PRD:** `tasks/prd-class-management-system.md`  
**Generated:** 2026-03-05  
**Test Plan Version:** 1.0

## Scope

This test plan provides comprehensive acceptance test coverage for all 15 user stories in the Class Management System PRD:

- **US-001 to US-006:** Customer-facing workflow (CSV import, WhatsApp, terms, QR, rescheduling)
- **US-007 to US-013:** Admin portal (login, audit, class/session/terms management)
- **US-014 to US-015:** Terms blocking and attendance tracking

Test levels included:
- **Integration tests:** End-to-end workflows across Convex backend and Next.js frontend
- **E2E tests:** Browser-based user flows for terms acceptance, admin actions, QR scanning
- **Unit tests:** CSV parsing, validation logic, quota calculations

## Out of Scope

- Payment processing (external to system)
- Email notifications (WhatsApp only)
- Customer login system (UUID-based access)
- Mobile app testing (web responsive only)
- Multi-language support
- Refund processing
- Session waitlist functionality
- Recurring/subscription classes
- Real-time external inventory sync

## Assumptions and Ambiguities

**A-001:** CSV upload mechanism  
- **Issue:** PRD doesn't specify how CSVs are uploaded to Convex file storage
- **Assumption:** Manual upload via Convex dashboard or programmatic upload API
- **Impact:** Test setup will use programmatic file creation in storage

**A-002:** WhatsApp delivery confirmation  
- **Issue:** No explicit requirement for delivery receipt tracking
- **Assumption:** Twilio API success response is sufficient; no delivery webhook verification
- **Impact:** Tests verify API call success, not actual message receipt

**A-003:** QR code format  
- **Issue:** PRD states "encode participant_id" but doesn't specify QR format (URL, plain UUID, JSON)
- **Assumption:** QR encodes plain participant_id UUID string
- **Impact:** Scanner must parse plain UUID from QR data

**A-004:** Camera permission denial handling  
- **Issue:** PRD asks "What if camera permissions denied?" as open question
- **Assumption:** Show error message; no manual fallback input tested in this version
- **Impact:** Test will verify error message display on permission denial

**A-005:** Session date validation  
- **Issue:** "2 days before" calculation unclear (calendar days, business days, 48 hours?)
- **Assumption:** 48-hour window (2 * 24 hours) from current timestamp
- **Impact:** Date math tests use 48-hour threshold

**A-006:** Duplicate attendance marking  
- **Issue:** PRD says "show warning" but doesn't specify if it still updates timestamp
- **Assumption:** No update on duplicate; display original timestamp only
- **Impact:** Test verifies attendance_records table unchanged after duplicate scan

## Risk Areas

**R-001:** CSV parsing edge cases  
- Malformed CSV rows (missing columns, extra commas, encoding issues)
- Very large CSVs (>1000 rows) may timeout cron job
- Mitigation: Validate CSV structure before processing, implement batch processing

**R-002:** WhatsApp rate limiting  
- Twilio may rate-limit bulk sends if many purchases processed at once
- Mitigation: Queue WhatsApp messages, implement retry logic

**R-003:** Session quota race conditions  
- Concurrent terms submissions may over-book sessions if quota not atomically decremented
- Mitigation: Use Convex transactional writes for quota updates

**R-004:** QR scanner browser compatibility  
- WebRTC camera access varies across mobile browsers (iOS Safari, Android Chrome)
- Mitigation: Test on target devices; provide fallback message if unsupported

**R-005:** Admin session timeout  
- Long-running admin sessions may expire mid-action
- Mitigation: Implement session refresh or clear timeout warnings

**R-006:** Terms version race condition  
- If two admins create terms versions simultaneously, is_current flags may conflict
- Mitigation: Use Convex optimistic concurrency or single-writer pattern

## Scenario Matrix

| ID | Source | Level | Scenario | Steps | Expected Result | Evidence | Priority |
|----|--------|-------|----------|-------|-----------------|----------|----------|
| **TC-001** | US-001 | Integration | CSV import creates purchase records | 1. Upload CSV with 2 valid rows<br>2. Wait for cron job (max 60s)<br>3. Query purchases table | Purchases table has 2 new records with status='pending_terms' | Database query result | P0 |
| **TC-002** | US-001 | Integration | Duplicate order_id rejected | 1. Upload CSV with order_id=ORD123<br>2. Wait for import<br>3. Upload same CSV again<br>4. Check logs | Second import flagged as duplicate; admin notified | Audit log entry + admin notification | P0 |
| **TC-003** | US-001 | Unit | CSV parser handles malformed row | 1. Parse CSV with missing participant_count column | Parser raises validation error; row skipped | Error log entry | P1 |
| **TC-004** | US-002 | Integration | WhatsApp sent after purchase import | 1. Insert purchase record via mutation<br>2. Trigger confirmation action<br>3. Check purchase status | Purchase status='confirmation_sent'; Twilio API called with correct mobile number | Mock Twilio response + status update | P0 |
| **TC-005** | US-002 | Integration | WhatsApp contains valid terms link | 1. Trigger confirmation for purchase_id=X<br>2. Extract token from message body | Message contains `https://[domain]/terms?token=[uuid]` with valid UUID | Regex match on message text | P0 |
| **TC-006** | US-003 | E2E | Terms page loads with valid token | 1. Navigate to `/terms?token=[valid_uuid]`<br>2. Check page content | Page displays class name, customer info, session dropdown | Browser screenshot | P0 |
| **TC-007** | US-003 | E2E | Terms page shows only available sessions | 1. Set session A quota_used=quota_defined (full)<br>2. Load terms page<br>3. Check dropdown | Dropdown excludes session A; shows sessions with available>0 | DOM inspection | P0 |
| **TC-008** | US-003 | E2E | Submit button disabled until terms checked | 1. Load terms page<br>2. Select session<br>3. Do NOT check terms checkbox<br>4. Click submit | Button remains disabled; form not submitted | Button state assertion | P1 |
| **TC-009** | US-003 | E2E | Terms acceptance saves session and timestamp | 1. Load terms page<br>2. Select session S1<br>3. Check terms checkbox<br>4. Submit form<br>5. Query database | Purchase status='terms_accepted'; session_id=S1; timestamp recorded | Database query | P0 |
| **TC-010** | US-004 | Integration | Participant records created after terms | 1. Submit terms for purchase with participant_count=3<br>2. Query participants table | 3 participant records created with unique participant_ids | Row count + UUID validation | P0 |
| **TC-011** | US-004 | Integration | WhatsApp sent with participant links | 1. Submit terms for participant_count=2<br>2. Check WhatsApp message | Message contains 2 links: `https://[domain]/participant/[uuid1]` and `[uuid2]` | Message body parsing | P0 |
| **TC-012** | US-005 | E2E | Participant page displays QR code | 1. Navigate to `/participant/[valid_uuid]`<br>2. Check page content | Page displays participant details + QR code image | Visual QR code presence | P0 |
| **TC-013** | US-005 | E2E | QR code encodes participant_id | 1. Load participant page<br>2. Scan QR with test scanner<br>3. Decode data | Decoded data equals participant_id UUID | QR decode result | P0 |
| **TC-014** | US-005 | E2E | Change Session button only shown when >2 days | 1. Create session with date = today + 3 days<br>2. Load participant page | "Change Session" button visible | Button presence check | P1 |
| **TC-015** | US-005 | E2E | Change Session button hidden when <2 days | 1. Create session with date = today + 1 day<br>2. Load participant page | "Change Session" button NOT visible | Button absence check | P1 |
| **TC-016** | US-006 | E2E | Participant can reschedule session | 1. Load participant page (>2 days)<br>2. Click "Change Session"<br>3. Select new session from dropdown<br>4. Submit<br>5. Check database | participant.session_id updated to new session; old session quota+1; new session quota-1 | Database query | P0 |
| **TC-017** | US-006 | E2E | Unlimited rescheduling allowed within window | 1. Reschedule participant to session A<br>2. Reschedule same participant to session B<br>3. Reschedule to session C | All reschedules succeed; final session_id=C | Success messages + final state | P1 |
| **TC-018** | US-006 | Integration | No WhatsApp sent on self-reschedule | 1. Reschedule participant session<br>2. Check Twilio call log | No Twilio API call made | Mock call count = 0 | P1 |
| **TC-019** | US-007 | E2E | Admin can log in with valid credentials | 1. Navigate to `/admin/login`<br>2. Enter username=admin, password=admin123<br>3. Submit form | Redirected to `/admin/dashboard`; session cookie set | URL check + cookie presence | P0 |
| **TC-020** | US-007 | E2E | Admin login fails with invalid password | 1. Navigate to `/admin/login`<br>2. Enter username=admin, password=wrong<br>3. Submit form | Error message displayed; no redirect | Error message text | P0 |
| **TC-021** | US-007 | E2E | Admin role stored in session | 1. Log in as super_admin<br>2. Check session data | Session contains role='super_admin' | Session inspection | P1 |
| **TC-022** | US-008 | Integration | Admin action logged to audit_logs | 1. Log in as admin<br>2. Create new class<br>3. Query audit_logs | New log entry with action_type='create_class', admin_username, timestamp, changes_json | Audit log query | P0 |
| **TC-023** | US-008 | Integration | Audit log captures before/after state | 1. Edit session quota from 20 to 25<br>2. Check audit log | changes_json contains before: {quota:20}, after: {quota:25} | JSON parsing | P1 |
| **TC-024** | US-009 | E2E | Super Admin can create class | 1. Log in as super_admin<br>2. Navigate to `/admin/classes`<br>3. Click "Add Class"<br>4. Enter name, description<br>5. Submit | New class appears in table; audit log entry created | Table row + audit log | P0 |
| **TC-025** | US-009 | E2E | Regular Admin cannot create class | 1. Log in as regular_admin<br>2. Navigate to `/admin/classes`<br>3. Check UI | "Add Class" button NOT visible | Button absence | P0 |
| **TC-026** | US-009 | E2E | Super Admin can cancel class | 1. Log in as super_admin<br>2. Click "Cancel" on class<br>3. Confirm dialog<br>4. Check database | Class status='cancelled' | Status query | P1 |
| **TC-027** | US-010 | E2E | Super Admin can create session | 1. Navigate to `/admin/classes/[class_id]/sessions`<br>2. Click "Add Session"<br>3. Enter location, date, time, quota<br>4. Submit | New session appears in table | Table row | P0 |
| **TC-028** | US-010 | E2E | Session quota displays as defined/used/available | 1. Create session with quota=20<br>2. Add 15 participants<br>3. View session list | Quota column shows "20 / 15 / 5" | Text content | P0 |
| **TC-029** | US-010 | E2E | Full session marked with red indicator | 1. Create session with quota=10<br>2. Add 10 participants (full)<br>3. View session list | Session row has red "Full" badge | Visual indicator | P1 |
| **TC-030** | US-010 | E2E | Session cancellation sends WhatsApp to participants | 1. Cancel session with 5 participants<br>2. Check Twilio logs | 5 WhatsApp messages sent with cancellation notice | Twilio call count | P1 |
| **TC-031** | US-011 | E2E | Admin can view participant list | 1. Navigate to `/admin/sessions/[session_id]/participants`<br>2. Check table content | Table displays participant_id, name, mobile, terms_accepted status | Table inspection | P0 |
| **TC-032** | US-011 | E2E | View Terms modal displays accepted terms | 1. Click "View Terms" on participant row<br>2. Check modal content | Modal shows full terms text from participant's accepted version | Modal text | P1 |
| **TC-033** | US-011 | E2E | Super Admin can export participant CSV | 1. Click "Export" button on participant list<br>2. Check download | CSV file downloaded with participant data | File download + content | P2 |
| **TC-034** | US-012 | E2E | Super Admin can change participant session | 1. Click "Change Session" on participant row<br>2. Select new session<br>3. Submit | Participant session_id updated; WhatsApp sent | Database + Twilio log | P0 |
| **TC-035** | US-012 | E2E | Regular Admin cannot change participant session | 1. Log in as regular_admin<br>2. View participant list | "Change Session" button NOT visible | Button absence | P0 |
| **TC-036** | US-012 | Integration | Admin session change sends WhatsApp | 1. Change participant from session A to B via admin<br>2. Check Twilio log | WhatsApp sent with new session details | Message body | P0 |
| **TC-037** | US-013 | E2E | Super Admin can create new terms version | 1. Navigate to `/admin/terms`<br>2. Click "Create New Version"<br>3. Enter terms text<br>4. Save | New version created with is_current=true; old version is_current=false | Database query | P0 |
| **TC-038** | US-013 | E2E | New terms version applies to future participants | 1. Create terms version V2<br>2. Create new purchase<br>3. Accept terms<br>4. Check participant record | Participant terms_version_id = V2 | Foreign key check | P1 |
| **TC-039** | US-013 | E2E | Old participants retain original terms version | 1. Participant P1 accepted terms V1<br>2. Create terms V2<br>3. Check P1 record | P1 terms_version_id still = V1 (immutable) | Version reference | P0 |
| **TC-040** | US-014 | Integration | Purchase without terms acceptance has no participants | 1. Create purchase P1<br>2. Do NOT submit terms<br>3. Query participants table | Zero participant records for P1 | Row count = 0 | P0 |
| **TC-041** | US-014 | E2E | Terms page shows blocking message | 1. Load terms page without submitting<br>2. Check message | "You must accept terms to receive your participant QR code" displayed | Text content | P1 |
| **TC-042** | US-014 | E2E | Admin dashboard flags unaccepted purchases | 1. Create purchase with status='confirmation_sent'<br>2. View admin dashboard | Purchase row highlighted in red | Visual indicator | P2 |
| **TC-043** | US-015 | E2E | Admin can scan QR and mark attendance | 1. Navigate to `/admin/sessions/[session_id]/participants`<br>2. Click "Scan QR Code"<br>3. Grant camera permission<br>4. Scan participant QR<br>5. Check UI | Success toast with participant name; attendance checkmark appears | Toast message + UI update | P0 |
| **TC-044** | US-015 | Integration | Valid QR creates attendance record | 1. Scan participant QR<br>2. Query attendance_records | New record with participant_id, session_id, marked_by_admin, marked_at | Database query | P0 |
| **TC-045** | US-015 | E2E | Invalid session QR shows error | 1. Scan QR for participant in session A<br>2. While viewing session B participant list | Error: "This participant is not registered for this session" | Error message | P0 |
| **TC-046** | US-015 | E2E | Duplicate scan shows warning | 1. Scan participant QR<br>2. Scan same QR again | Warning: "Already marked attended at [timestamp]" | Warning message + original timestamp | P1 |
| **TC-047** | US-015 | E2E | Regular Admin can mark attendance | 1. Log in as regular_admin<br>2. Navigate to participant list<br>3. Click "Scan QR Code" | Scanner opens; attendance marking allowed | Camera UI | P0 |
| **TC-048** | US-015 | Integration | Attendance action logged to audit_logs | 1. Mark attendance for participant P1<br>2. Query audit_logs | Log entry with action_type='mark_attendance', participant_id, admin_username | Audit log | P1 |
| **TC-049** | US-015 | E2E | Camera permission denied shows error | 1. Click "Scan QR Code"<br>2. Deny camera permission<br>3. Check UI | Error message: "Camera access denied. Please enable permissions." | Error text | P2 |
| **TC-050** | FR-19 | Integration | Session change updates quotas atomically | 1. Session A quota=20/15/5; Session B quota=20/10/10<br>2. Move participant from A to B<br>3. Query both sessions | Session A quota=20/14/6; Session B quota=20/11/9 | Quota calculations | P0 |

## Execution Strategy

**Phase 1: Core Workflow (P0 scenarios)**
- Priority: TC-001, TC-004, TC-006, TC-009, TC-010, TC-012, TC-019, TC-024, TC-027, TC-031, TC-034, TC-037, TC-040, TC-043, TC-044, TC-045
- Duration: 2-3 days
- Environment: Local dev + staging Convex deployment
- Tools: Jest (integration), Playwright (E2E)

**Phase 2: Validation & Edge Cases (P1 scenarios)**
- Priority: TC-003, TC-008, TC-014-018, TC-021-023, TC-026, TC-029-032, TC-038-039, TC-046, TC-048
- Duration: 1-2 days
- Environment: Staging
- Tools: Same as Phase 1

**Phase 3: Nice-to-Have (P2 scenarios)**
- Priority: TC-033, TC-042, TC-049
- Duration: 1 day
- Environment: Staging
- Tools: Same as Phase 1

**Test Data Setup:**
- Seed database with 2 admins (super_admin, regular_admin)
- Seed 2 classes with 4 sessions each
- Seed 1 active terms version
- Mock Twilio API for WhatsApp verification (use test credentials or mock server)

**Browser Targets:**
- Desktop: Chrome (latest), Firefox (latest)
- Mobile: iOS Safari 15+, Android Chrome (latest)

## Entry/Exit Criteria

**Entry Criteria:**
- [ ] All 15 user stories implemented and deployed to staging
- [ ] Convex schema matches PRD specification
- [ ] Twilio test credentials configured
- [ ] Seed data script ready
- [ ] Test environment accessible

**Exit Criteria:**
- [ ] All P0 scenarios pass (100%)
- [ ] At least 90% of P1 scenarios pass
- [ ] All critical bugs (blocking user workflows) resolved
- [ ] Audit log verification complete for all admin actions
- [ ] QR scanning tested on target mobile devices
- [ ] Test report generated with screenshots and evidence

## Evidence Requirements

Each test execution must capture:
1. **Integration tests:** Database query results (JSON snapshots)
2. **E2E tests:** Browser screenshots at key steps
3. **QR scanning:** Photo of scanned QR + decoded data log
4. **WhatsApp verification:** Twilio API mock call logs with message bodies
5. **Audit logs:** SQL/Convex query results showing log entries
6. **Error cases:** Error message screenshots

Evidence storage: `/tasks/test-evidence/[test-id]/`

## Traceability

| User Story | Test Cases |
|------------|------------|
| US-001 | TC-001, TC-002, TC-003 |
| US-002 | TC-004, TC-005 |
| US-003 | TC-006, TC-007, TC-008, TC-009 |
| US-004 | TC-010, TC-011 |
| US-005 | TC-012, TC-013, TC-014, TC-015 |
| US-006 | TC-016, TC-017, TC-018 |
| US-007 | TC-019, TC-020, TC-021 |
| US-008 | TC-022, TC-023 |
| US-009 | TC-024, TC-025, TC-026 |
| US-010 | TC-027, TC-028, TC-029, TC-030 |
| US-011 | TC-031, TC-032, TC-033 |
| US-012 | TC-034, TC-035, TC-036 |
| US-013 | TC-037, TC-038, TC-039 |
| US-014 | TC-040, TC-041, TC-042 |
| US-015 | TC-043, TC-044, TC-045, TC-046, TC-047, TC-048, TC-049 |
| FR-19 | TC-050 |

**Coverage Summary:**
- 15 User Stories → 50 Test Cases
- 100% US coverage
- Critical FR (quota atomicity) covered explicitly
