#!/usr/bin/env python3
import json
import re
from datetime import datetime

# Parse scenario matrix into test cases
test_cases = [
    {"id": "TC-001", "source": "US-001", "level": "integration", "priority": "P0", "title": "CSV import creates purchase records", "steps": ["Upload CSV with 2 valid rows", "Wait for cron job (max 60s)", "Query purchases table"], "passFail": ["Purchases table has 2 new records with status='pending_terms'"], "evidence": ["Database query result"]},
    {"id": "TC-002", "source": "US-001", "level": "integration", "priority": "P0", "title": "Duplicate order_id rejected", "steps": ["Upload CSV with order_id=ORD123", "Wait for import", "Upload same CSV again", "Check logs"], "passFail": ["Second import flagged as duplicate; admin notified"], "evidence": ["Audit log entry + admin notification"]},
    {"id": "TC-003", "source": "US-001", "level": "unit", "priority": "P1", "title": "CSV parser handles malformed row", "steps": ["Parse CSV with missing participant_count column"], "passFail": ["Parser raises validation error; row skipped"], "evidence": ["Error log entry"]},
    {"id": "TC-004", "source": "US-002", "level": "integration", "priority": "P0", "title": "WhatsApp sent after purchase import", "steps": ["Insert purchase record via mutation", "Trigger confirmation action", "Check purchase status"], "passFail": ["Purchase status='confirmation_sent'; Twilio API called with correct mobile number"], "evidence": ["Mock Twilio response + status update"]},
    {"id": "TC-005", "source": "US-002", "level": "integration", "priority": "P0", "title": "WhatsApp contains valid terms link", "steps": ["Trigger confirmation for purchase_id=X", "Extract token from message body"], "passFail": ["Message contains `https://[domain]/terms?token=[uuid]` with valid UUID"], "evidence": ["Regex match on message text"]},
    {"id": "TC-006", "source": "US-003", "level": "e2e", "priority": "P0", "title": "Terms page loads with valid token", "steps": ["Navigate to `/terms?token=[valid_uuid]`", "Check page content"], "passFail": ["Page displays class name, customer info, session dropdown"], "evidence": ["Browser screenshot"]},
    {"id": "TC-007", "source": "US-003", "level": "e2e", "priority": "P0", "title": "Terms page shows only available sessions", "steps": ["Set session A quota_used=quota_defined (full)", "Load terms page", "Check dropdown"], "passFail": ["Dropdown excludes session A; shows sessions with available>0"], "evidence": ["DOM inspection"]},
    {"id": "TC-008", "source": "US-003", "level": "e2e", "priority": "P1", "title": "Submit button disabled until terms checked", "steps": ["Load terms page", "Select session", "Do NOT check terms checkbox", "Click submit"], "passFail": ["Button remains disabled; form not submitted"], "evidence": ["Button state assertion"]},
    {"id": "TC-009", "source": "US-003", "level": "e2e", "priority": "P0", "title": "Terms acceptance saves session and timestamp", "steps": ["Load terms page", "Select session S1", "Check terms checkbox", "Submit form", "Query database"], "passFail": ["Purchase status='terms_accepted'; session_id=S1; timestamp recorded"], "evidence": ["Database query"]},
    {"id": "TC-010", "source": "US-004", "level": "integration", "priority": "P0", "title": "Participant records created after terms", "steps": ["Submit terms for purchase with participant_count=3", "Query participants table"], "passFail": ["3 participant records created with unique participant_ids"], "evidence": ["Row count + UUID validation"]},
    {"id": "TC-011", "source": "US-004", "level": "integration", "priority": "P0", "title": "WhatsApp sent with participant links", "steps": ["Submit terms for participant_count=2", "Check WhatsApp message"], "passFail": ["Message contains 2 links: `https://[domain]/participant/[uuid1]` and `[uuid2]`"], "evidence": ["Message body parsing"]},
    {"id": "TC-012", "source": "US-005", "level": "e2e", "priority": "P0", "title": "Participant page displays QR code", "steps": ["Navigate to `/participant/[valid_uuid]`", "Check page content"], "passFail": ["Page displays participant details + QR code image"], "evidence": ["Visual QR code presence"]},
    {"id": "TC-013", "source": "US-005", "level": "e2e", "priority": "P0", "title": "QR code encodes participant_id", "steps": ["Load participant page", "Scan QR with test scanner", "Decode data"], "passFail": ["Decoded data equals participant_id UUID"], "evidence": ["QR decode result"]},
    {"id": "TC-014", "source": "US-005", "level": "e2e", "priority": "P1", "title": "Change Session button only shown when >2 days", "steps": ["Create session with date = today + 3 days", "Load participant page"], "passFail": ['"Change Session" button visible'], "evidence": ["Button presence check"]},
    {"id": "TC-015", "source": "US-005", "level": "e2e", "priority": "P1", "title": "Change Session button hidden when <2 days", "steps": ["Create session with date = today + 1 day", "Load participant page"], "passFail": ['"Change Session" button NOT visible'], "evidence": ["Button absence check"]},
    {"id": "TC-016", "source": "US-006", "level": "e2e", "priority": "P0", "title": "Participant can reschedule session", "steps": ["Load participant page (>2 days)", "Click \"Change Session\"", "Select new session from dropdown", "Submit", "Check database"], "passFail": ["participant.session_id updated to new session; old session quota+1; new session quota-1"], "evidence": ["Database query"]},
    {"id": "TC-017", "source": "US-006", "level": "e2e", "priority": "P1", "title": "Unlimited rescheduling allowed within window", "steps": ["Reschedule participant to session A", "Reschedule same participant to session B", "Reschedule to session C"], "passFail": ["All reschedules succeed; final session_id=C"], "evidence": ["Success messages + final state"]},
    {"id": "TC-018", "source": "US-006", "level": "integration", "priority": "P1", "title": "No WhatsApp sent on self-reschedule", "steps": ["Reschedule participant session", "Check Twilio call log"], "passFail": ["No Twilio API call made"], "evidence": ["Mock call count = 0"]},
    {"id": "TC-019", "source": "US-007", "level": "e2e", "priority": "P0", "title": "Admin can log in with valid credentials", "steps": ["Navigate to `/admin/login`", "Enter username=admin, password=admin123", "Submit form"], "passFail": ["Redirected to `/admin/dashboard`; session cookie set"], "evidence": ["URL check + cookie presence"]},
    {"id": "TC-020", "source": "US-007", "level": "e2e", "priority": "P0", "title": "Admin login fails with invalid password", "steps": ["Navigate to `/admin/login`", "Enter username=admin, password=wrong", "Submit form"], "passFail": ["Error message displayed; no redirect"], "evidence": ["Error message text"]},
    {"id": "TC-021", "source": "US-007", "level": "e2e", "priority": "P1", "title": "Admin role stored in session", "steps": ["Log in as super_admin", "Check session data"], "passFail": ["Session contains role='super_admin'"], "evidence": ["Session inspection"]},
    {"id": "TC-022", "source": "US-008", "level": "integration", "priority": "P0", "title": "Admin action logged to audit_logs", "steps": ["Log in as admin", "Create new class", "Query audit_logs"], "passFail": ["New log entry with action_type='create_class', admin_username, timestamp, changes_json"], "evidence": ["Audit log query"]},
    {"id": "TC-023", "source": "US-008", "level": "integration", "priority": "P1", "title": "Audit log captures before/after state", "steps": ["Edit session quota from 20 to 25", "Check audit log"], "passFail": ["changes_json contains before: {quota:20}, after: {quota:25}"], "evidence": ["JSON parsing"]},
    {"id": "TC-024", "source": "US-009", "level": "e2e", "priority": "P0", "title": "Super Admin can create class", "steps": ["Log in as super_admin", "Navigate to `/admin/classes`", "Click \"Add Class\"", "Enter name, description", "Submit"], "passFail": ["New class appears in table; audit log entry created"], "evidence": ["Table row + audit log"]},
    {"id": "TC-025", "source": "US-009", "level": "e2e", "priority": "P0", "title": "Regular Admin cannot create class", "steps": ["Log in as regular_admin", "Navigate to `/admin/classes`", "Check UI"], "passFail": ['"Add Class" button NOT visible'], "evidence": ["Button absence"]},
    {"id": "TC-026", "source": "US-009", "level": "e2e", "priority": "P1", "title": "Super Admin can cancel class", "steps": ["Log in as super_admin", "Click \"Cancel\" on class", "Confirm dialog", "Check database"], "passFail": ["Class status='cancelled'"], "evidence": ["Status query"]},
    {"id": "TC-027", "source": "US-010", "level": "e2e", "priority": "P0", "title": "Super Admin can create session", "steps": ["Navigate to `/admin/classes/[class_id]/sessions`", "Click \"Add Session\"", "Enter location, date, time, quota", "Submit"], "passFail": ["New session appears in table"], "evidence": ["Table row"]},
    {"id": "TC-028", "source": "US-010", "level": "e2e", "priority": "P0", "title": "Session quota displays as defined/used/available", "steps": ["Create session with quota=20", "Add 15 participants", "View session list"], "passFail": ['Quota column shows "20 / 15 / 5"'], "evidence": ["Text content"]},
    {"id": "TC-029", "source": "US-010", "level": "e2e", "priority": "P1", "title": "Full session marked with red indicator", "steps": ["Create session with quota=10", "Add 10 participants (full)", "View session list"], "passFail": ['Session row has red "Full" badge'], "evidence": ["Visual indicator"]},
    {"id": "TC-030", "source": "US-010", "level": "e2e", "priority": "P1", "title": "Session cancellation sends WhatsApp to participants", "steps": ["Cancel session with 5 participants", "Check Twilio logs"], "passFail": ["5 WhatsApp messages sent with cancellation notice"], "evidence": ["Twilio call count"]},
    {"id": "TC-031", "source": "US-011", "level": "e2e", "priority": "P0", "title": "Admin can view participant list", "steps": ["Navigate to `/admin/sessions/[session_id]/participants`", "Check table content"], "passFail": ["Table displays participant_id, name, mobile, terms_accepted status"], "evidence": ["Table inspection"]},
    {"id": "TC-032", "source": "US-011", "level": "e2e", "priority": "P1", "title": "View Terms modal displays accepted terms", "steps": ["Click \"View Terms\" on participant row", "Check modal content"], "passFail": ["Modal shows full terms text from participant's accepted version"], "evidence": ["Modal text"]},
    {"id": "TC-033", "source": "US-011", "level": "e2e", "priority": "P2", "title": "Super Admin can export participant CSV", "steps": ["Click \"Export\" button on participant list", "Check download"], "passFail": ["CSV file downloaded with participant data"], "evidence": ["File download + content"]},
    {"id": "TC-034", "source": "US-012", "level": "e2e", "priority": "P0", "title": "Super Admin can change participant session", "steps": ["Click \"Change Session\" on participant row", "Select new session", "Submit"], "passFail": ["Participant session_id updated; WhatsApp sent"], "evidence": ["Database + Twilio log"]},
    {"id": "TC-035", "source": "US-012", "level": "e2e", "priority": "P0", "title": "Regular Admin cannot change participant session", "steps": ["Log in as regular_admin", "View participant list"], "passFail": ['"Change Session" button NOT visible'], "evidence": ["Button absence"]},
    {"id": "TC-036", "source": "US-012", "level": "integration", "priority": "P0", "title": "Admin session change sends WhatsApp", "steps": ["Change participant from session A to B via admin", "Check Twilio log"], "passFail": ["WhatsApp sent with new session details"], "evidence": ["Message body"]},
    {"id": "TC-037", "source": "US-013", "level": "e2e", "priority": "P0", "title": "Super Admin can create new terms version", "steps": ["Navigate to `/admin/terms`", "Click \"Create New Version\"", "Enter terms text", "Save"], "passFail": ["New version created with is_current=true; old version is_current=false"], "evidence": ["Database query"]},
    {"id": "TC-038", "source": "US-013", "level": "e2e", "priority": "P1", "title": "New terms version applies to future participants", "steps": ["Create terms version V2", "Create new purchase", "Accept terms", "Check participant record"], "passFail": ["Participant terms_version_id = V2"], "evidence": ["Foreign key check"]},
    {"id": "TC-039", "source": "US-013", "level": "e2e", "priority": "P0", "title": "Old participants retain original terms version", "steps": ["Participant P1 accepted terms V1", "Create terms V2", "Check P1 record"], "passFail": ["P1 terms_version_id still = V1 (immutable)"], "evidence": ["Version reference"]},
    {"id": "TC-040", "source": "US-014", "level": "integration", "priority": "P0", "title": "Purchase without terms acceptance has no participants", "steps": ["Create purchase P1", "Do NOT submit terms", "Query participants table"], "passFail": ["Zero participant records for P1"], "evidence": ["Row count = 0"]},
    {"id": "TC-041", "source": "US-014", "level": "e2e", "priority": "P1", "title": "Terms page shows blocking message", "steps": ["Load terms page without submitting", "Check message"], "passFail": ['"You must accept terms to receive your participant QR code" displayed'], "evidence": ["Text content"]},
    {"id": "TC-042", "source": "US-014", "level": "e2e", "priority": "P2", "title": "Admin dashboard flags unaccepted purchases", "steps": ["Create purchase with status='confirmation_sent'", "View admin dashboard"], "passFail": ["Purchase row highlighted in red"], "evidence": ["Visual indicator"]},
    {"id": "TC-043", "source": "US-015", "level": "e2e", "priority": "P0", "title": "Admin can scan QR and mark attendance", "steps": ["Navigate to `/admin/sessions/[session_id]/participants`", "Click \"Scan QR Code\"", "Grant camera permission", "Scan participant QR", "Check UI"], "passFail": ["Success toast with participant name; attendance checkmark appears"], "evidence": ["Toast message + UI update"]},
    {"id": "TC-044", "source": "US-015", "level": "integration", "priority": "P0", "title": "Valid QR creates attendance record", "steps": ["Scan participant QR", "Query attendance_records"], "passFail": ["New record with participant_id, session_id, marked_by_admin, marked_at"], "evidence": ["Database query"]},
    {"id": "TC-045", "source": "US-015", "level": "e2e", "priority": "P0", "title": "Invalid session QR shows error", "steps": ["Scan QR for participant in session A", "While viewing session B participant list"], "passFail": ['Error: "This participant is not registered for this session"'], "evidence": ["Error message"]},
    {"id": "TC-046", "source": "US-015", "level": "e2e", "priority": "P1", "title": "Duplicate scan shows warning", "steps": ["Scan participant QR", "Scan same QR again"], "passFail": ['Warning: "Already marked attended at [timestamp]"'], "evidence": ["Warning message + original timestamp"]},
    {"id": "TC-047", "source": "US-015", "level": "e2e", "priority": "P0", "title": "Regular Admin can mark attendance", "steps": ["Log in as regular_admin", "Navigate to participant list", "Click \"Scan QR Code\""], "passFail": ["Scanner opens; attendance marking allowed"], "evidence": ["Camera UI"]},
    {"id": "TC-048", "source": "US-015", "level": "integration", "priority": "P1", "title": "Attendance action logged to audit_logs", "steps": ["Mark attendance for participant P1", "Query audit_logs"], "passFail": ["Log entry with action_type='mark_attendance', participant_id, admin_username"], "evidence": ["Audit log"]},
    {"id": "TC-049", "source": "US-015", "level": "e2e", "priority": "P2", "title": "Camera permission denied shows error", "steps": ["Click \"Scan QR Code\"", "Deny camera permission", "Check UI"], "passFail": ['Error message: "Camera access denied. Please enable permissions."'], "evidence": ["Error text"]},
    {"id": "TC-050", "source": "FR-19", "level": "integration", "priority": "P0", "title": "Session change updates quotas atomically", "steps": ["Session A quota=20/15/5; Session B quota=20/10/10", "Move participant from A to B", "Query both sessions"], "passFail": ["Session A quota=20/14/6; Session B quota=20/11/9"], "evidence": ["Quota calculations"]},
]

# Generate retry rules based on priority
def get_retry_rules(priority):
    if priority == "P0":
        return [{"maxRetries": 0, "retryOn": ["flake", "timeout"]}]
    elif priority == "P1":
        return [{"maxRetries": 1, "retryOn": ["flake", "timeout"]}]
    else:  # P2
        return [{"maxRetries": 1, "retryOn": ["flake", "timeout", "infra"]}]

# Build JSON structure
json_output = {
    "qaPlanSchemaVersion": "1.0.0",
    "planId": "test-plan-class-management-system",
    "source": {
        "path": "tasks/test-plan-prd-class-management-system.md",
        "generatedAt": datetime.utcnow().isoformat() + "Z"
    },
    "execution": {
        "defaultRetryRule": {
            "maxRetries": 0,
            "retryOn": ["flake", "timeout"]
        }
    },
    "tests": []
}

# Convert test cases to JSON format
for tc in test_cases:
    test_obj = {
        "id": tc["id"],
        "source": tc["source"],
        "level": tc["level"],
        "priority": tc["priority"],
        "title": tc["title"],
        "steps": tc["steps"],
        "commands": [],  # Will be populated based on test level
        "passFail": tc["passFail"],
        "retryRules": get_retry_rules(tc["priority"]),
        "evidence": {
            "required": tc["evidence"],
            "artifacts": []
        }
    }
    
    # Add placeholder commands based on test level
    if tc["level"] == "e2e":
        test_obj["commands"] = ["npx playwright test --grep=" + tc["id"]]
    elif tc["level"] == "integration":
        test_obj["commands"] = ["npm test -- " + tc["id"]]
    elif tc["level"] == "unit":
        test_obj["commands"] = ["npm test -- --testNamePattern='" + tc["title"] + "'"]
    
    json_output["tests"].append(test_obj)

# Write JSON to file
with open('/home/ec2-user/.openclaw/workspace/class-management-system/tasks/test-plan-prd-class-management-system.json', 'w') as f:
    json.dump(json_output, f, indent=2)

print(f"✅ Converted {len(test_cases)} test cases to JSON")
print("Output: tasks/test-plan-prd-class-management-system.json")
