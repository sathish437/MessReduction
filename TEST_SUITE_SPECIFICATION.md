# MessReduction — Test Suite Specification (Agent 2 Output)

> **Document Type**: Comprehensive Test Plan & Test Suite Specification  
> **Source Target**: `sathish437/MessReduction`  
> **Input Spec**: Agent 1 Workflow Generation Prompt (WF-HAPPY, WF-NEG, WF-ALT, WF-BND, WF-ABU, WF-STATE, WF-INT)  
> **Test Categories Covered**: Positive (Happy), Negative (Client & Server Validation), Boundary (Limits & Skew), Adversarial/Security (OWASP & Authorization), State Transition Invariants, and Integration/Fault Tolerance.

---

## 1. Test Architecture & Execution Matrix

```
       +-----------------------------------------------------------+
       |                  Agent 2 Test Harness                     |
       +-----------------------------------------------------------+
                                     |
         +---------------------------+---------------------------+
         |                                                       |
+------------------+                                   +------------------+
| API / Unit Tier  |                                   |  E2E / UI Tier   |
| (MockMvc / JUnit)|                                   | (Playwright / WS)|
+------------------+                                   +------------------+
         |                                                       |
         +--- Auth & Token Validation (JWT)                      +--- Route Guards & Redirection
         +--- Form Lifecycle (Pending -> Approved/Rejected)      +--- Pre-filled Locked Fields
         +--- Boundary Values (Counts, Lengths, Dates, TZ)       +--- Bulk Selection & Progress
         +--- Role Scopes (Deputy gender+year, Admin, Warden)    +--- Error Modals & Toast State
         +--- Mock Integrations (Hostel API, FCM, WebPush)       +--- Double-click Debouncing
```

---

## 2. Test Suite Specifications by Workflow Group

---

### GROUP 1: Authentication, Registration & Session (WF-HAPPY-01, 02, 12; WF-NEG-01..08, 23..25; WF-ALT-01, 10..12; WF-ABU-01, 06..11, 20, 30)

#### TC-AUTH-001 [Positive]: Student Self-Registration with Hostel Verification Enabled
- **Target Workflow**: `WF-HAPPY-01`
- **Preconditions**: `STUDENT_VERIFY_ENABLED=true`, Mock `hostel-api.gces.net.in` configured to return student details for register number `730421104001`.
- **Test Steps**:
  1. Send `GET /api/auth/hostel-verification-status` -> Assert status `200`, `{ "enabled": true }`.
  2. Send `POST /api/auth/verify-hostel` with body `{"registerNo": "730421104001", "dob": "2003-05-15"}` -> Assert `200 OK`, response body contains `{ "name": "Arun Kumar", "registerNo": "730421104001", "department": "CSE" }`.
  3. Send `POST /api/student/reg` with body:
     ```json
     {
       "name": "Arun Kumar",
       "registerNo": "730421104001",
       "department": "CSE",
       "rollNo": "21CS001",
       "email": "arun@example.com",
       "phoneNo": "9876543210",
       "gender": "Male",
       "currentYear": 3,
       "dob": "2003-05-15"
     }
     ```
  4. Assert `201 Created` with non-null `studentId`. Verify row exists in `student_details` table.

#### TC-AUTH-002 [Positive]: Direct Registration when Verification is Disabled
- **Target Workflow**: `WF-ALT-01`
- **Preconditions**: `STUDENT_VERIFY_ENABLED=false`.
- **Test Steps**:
  1. `GET /api/auth/hostel-verification-status` -> Assert `{ "enabled": false }`.
  2. Directly send `POST /api/student/reg` without prior verification -> Assert `201 Created`.

#### TC-AUTH-003 [Positive]: Student Login & Session Key Storage
- **Target Workflow**: `WF-HAPPY-02`
- **Preconditions**: Student `730421104001` exists with DOB `2003-05-15`.
- **Test Steps**:
  1. `POST /api/auth/login` with `{"identifier": "730421104001", "dob": "2003-05-15"}`.
  2. Assert `200 OK`, JSON contains non-null `token` and `student` details.
  3. [UI Test]: Verify `localStorage` contains `auth_token`, `user_type`, `student_data` and `sessionStorage` has `token`, `currentUser`.
  4. Post FCM token: `POST /api/notifications/fcm-token` with header `Authorization: Bearer <token>` -> Assert `200 OK` or `201 Created`.

#### TC-AUTH-004 [Negative]: Student Login with Incorrect DOB
- **Target Workflow**: `WF-NEG-01`
- **Test Steps**:
  1. `POST /api/auth/login` with `{"identifier": "730421104001", "dob": "2000-01-01"}`.
  2. Assert `401 Unauthorized` with error message `"Invalid credentials"`.

#### TC-AUTH-005 [Negative]: Student Login with Non-Existent Identifier
- **Target Workflow**: `WF-NEG-02`
- **Test Steps**:
  1. `POST /api/auth/login` with `{"identifier": "999999999999", "dob": "2003-05-15"}`.
  2. Assert `401 Unauthorized` or `404 Not Found` (consistent message without user enumeration).

#### TC-AUTH-006 [Negative - Conflict]: Duplicate Unique Key Registrations
- **Target Workflow**: `WF-NEG-05, WF-NEG-06, WF-NEG-07, WF-NEG-08, WF-ABU-20`
- **Test Matrix**:
  | Test Case Sub-ID | Field Tested | Duplicate Value Injected | Expected Response |
  | :--- | :--- | :--- | :--- |
  | TC-AUTH-006a | Email | Existing student's email | `409 Conflict`, `DuplicateStudentException` |
  | TC-AUTH-006b | Register No | Existing `registerNo` | `409 Conflict`, `DuplicateStudentException` |
  | TC-AUTH-006c | Roll No | Existing `rollNo` | `409 Conflict`, `DuplicateStudentException` |
  | TC-AUTH-006d | Phone No | Existing `phoneNo` | `409 Conflict`, `DuplicateStudentException` |
  | TC-AUTH-006e | Admin Email | Target admin email | `409 Conflict` (collision constraint) |

#### TC-AUTH-007 [Negative & Adversarial]: JWT Expiry, Tampering & Route Access
- **Target Workflow**: `WF-NEG-23, WF-NEG-24, WF-NEG-25, WF-ABU-06, WF-ABU-07, WF-ABU-08`
- **Test Matrix**:
  | Sub-ID | Scenario | Input Vector / Manipulation | Expected Status | Assertion |
  | :--- | :--- | :--- | :--- | :--- |
  | TC-AUTH-007a | Expired Token | JWT with `exp` in the past | `401 Unauthorized` | Handled by `JwtAuthEntryPoint` |
  | TC-AUTH-007b | Missing Token | No `Authorization` header | `401 Unauthorized` | Intercepted before controller |
  | TC-AUTH-007c | Malformed Token | `Bearer invalid.jwt.string` | `401 Unauthorized` | Parser failure caught cleanly |
  | TC-AUTH-007d | Role Escalation | Student JWT with payload `role: "ROLE_ADMIN"` (re-signed with forged key) | `401 Unauthorized` | Signature validation failure |
  | TC-AUTH-007e | Cross-Student Tamper | Student A JWT with `studentId` changed to Student B's ID | `401 Unauthorized` | Signature check fails |

#### TC-AUTH-008 [Security / Adversarial]: SQL Injection in Login
- **Target Workflow**: `WF-ABU-01`
- **Payload**: `identifier = "' OR '1'='1"`, `dob = "2000-01-01"`.
- **Expected**: `401 Unauthorized` or `400 Bad Request`. Zero database leak, parameterized JPA queries verified.

---

### GROUP 2: Mess Reduction Form Submission & Daily Limits (WF-HAPPY-03, 10, 19, 20; WF-NEG-09..14, 19..20, 34; WF-ALT-05, 07; WF-BND-01..08, 16..21, 28..32; WF-ABU-12, 13, 21)

#### TC-FORM-001 [Positive]: First Valid Form Submission of the Day
- **Target Workflow**: `WF-HAPPY-03`
- **Actor**: Student (Year 2, Male, `studentId = 101`).
- **Test Steps**:
  1. Reset student submission count for the test date.
  2. Send `POST /api/student-form/StudentForm/101` with:
     ```json
     {
       "year": 2,
       "roomNo": 214,
       "leaveDate": "2026-10-01",
       "leaveTime": "08:00",
       "arrivalDate": "2026-10-05",
       "arrivalTime": "18:00",
       "reason": "Attending national technical symposium",
       "additionalRemarks": "Permission letter attached"
     }
     ```
  3. Assert `201 Created`, response DTO contains:
     - `status = "PendingDeputyWarden"`
     - `deputyWardenId` matches Deputy Warden mapped to `(Male, Year 2)`.
  4. Assert `ReductionFormHistory` contains record with event `SUBMITTED`.
  5. Assert `AppNotification` created for assigned deputy warden.

#### TC-FORM-002 [Boundary]: Daily Submission Quota (3/3) & 4th Attempt Rejection
- **Target Workflow**: `WF-BND-01, WF-BND-02, WF-NEG-12`
- **Test Steps**:
  1. Post Form 1 -> Assert `201 Created` (Count: 1).
  2. Post Form 2 (non-overlapping dates) -> Assert `201 Created` (Count: 2).
  3. Post Form 3 (non-overlapping dates) -> Assert `201 Created` (Count: 3).
  4. Verify limits endpoint indicates `0 remaining`.
  5. Post Form 4 -> Assert `400 Bad Request` or `429 Too Many Requests` (Daily submission limit reached). Verify no row created.

#### TC-FORM-003 [Positive]: Extra Submission Request Lifecycle
- **Target Workflow**: `WF-HAPPY-10, WF-BND-03, WF-STATE-11, WF-STATE-12`
- **Test Steps**:
  1. Given Student at limit (3/3), send `POST /api/student-form/extra-submission/101` with `{"reason": "Emergency medical departure"}`.
  2. Assert `201 Created`, `ExtraSubmissionRequest` status is `PENDING`.
  3. Admin approves: `POST /api/admin/extra-submissions/{id}/approve` -> Assert `200 OK`.
  4. Student submits 4th form -> Assert `201 Created` (Daily count now 4/4).

#### TC-FORM-004 [Negative]: Submission Validation Violations
- **Target Workflow**: `WF-NEG-09, WF-NEG-10, WF-NEG-11, WF-NEG-13, WF-NEG-14, WF-BND-20`
- **Test Matrix**:
  | Sub-ID | Scenario | Invalid Payload Property | Expected Error |
  | :--- | :--- | :--- | :--- |
  | TC-FORM-004a | Missing Reason | `reason: ""` or omitted | `400 Bad Request` (`MethodArgumentNotValidException`) |
  | TC-FORM-004b | Arrival Before Leave | `leaveDate: 2026-10-05`, `arrivalDate: 2026-10-01` | `400 Bad Request` (`DateNotValidException`) |
  | TC-FORM-004c | Past Date Submission | `leaveDate: 2020-01-01` | `400 Bad Request` |
  | TC-FORM-004d | Invalid Year | `year: 0` or `year: 5` | `400 Bad Request` (`@Min(1) @Max(4)`) |
  | TC-FORM-004e | Negative Room No | `roomNo: -1` | `400 Bad Request` (`@Positive`) |
  | TC-FORM-004f | toDate < arrivalDate | `toDate: 2026-10-03`, `arrivalDate: 2026-10-05` | `400 Bad Request` |

#### TC-FORM-005 [Boundary & Overlap]: Date & Input Boundaries
- **Target Workflow**: `WF-BND-05, WF-BND-06, WF-BND-07, WF-BND-17, WF-BND-19, WF-BND-21`
- **Test Steps**:
  1. **Equal Leave and Arrival Date**: `leaveDate = 2026-10-10`, `arrivalDate = 2026-10-10` -> Assert `201 Created` (`totalHolidays` calculated as 0 or 1 per business logic).
  2. **Leap Year Date**: `leaveDate = 2028-02-29`, `arrivalDate = 2028-03-01` -> Assert `201 Created`.
  3. **Time Boundaries**: `leaveTime = "00:00"`, `arrivalTime = "23:59"` -> Assert `201 Created`.
  4. **Max Room Number**: `roomNo = 999999` -> Assert `201 Created`.
  5. **Reason Max Length**: Submit `reason` of exactly 1000 characters -> Assert `201 Created`.
  6. **Overlapping Requests**: Submit second form whose date window intersects with an existing active form -> Assert `400 Bad Request` / `Conflict`.

#### TC-FORM-006 [Adversarial]: Insecure Direct Object Reference (IDOR) & Script Injection
- **Target Workflow**: `WF-ABU-03, WF-ABU-13, WF-BND-29`
- **Test Steps**:
  1. Student A (JWT for `studentId = 101`) calls `POST /api/student-form/StudentForm/102` (Student B's ID) -> Assert `403 Forbidden`.
  2. Student submits reason: `<script>alert('XSS')</script><b>Test</b>` -> Assert stored content is escaped on retrieval or HTML-sanitized.

#### TC-FORM-007 [Positive / State]: Soft-Delete Pending Form
- **Target Workflow**: `WF-HAPPY-19, WF-STATE-08, WF-NEG-20`
- **Test Steps**:
  1. Given form in `PendingDeputyWarden`, student calls `DELETE /api/student-form/StudentForm/{studentId}/{formId}` -> Assert `200 OK`.
  2. Verify DB contains `deletedByStudent = true` and `deletedAt != null`.
  3. Call `GET /api/student-form/StudentForm/{studentId}` -> Assert deleted form is excluded.
  4. Attempt to delete an `Approved` form -> Assert `400` or `409 Conflict`.

#### TC-FORM-008 [Positive / State]: Resubmit Rejected Form
- **Target Workflow**: `WF-HAPPY-20, WF-ALT-02..04, WF-STATE-07, WF-NEG-19`
- **Test Steps**:
  1. Given form with status `RejectedDeputyWarden`.
  2. Student calls `POST /api/student-form/StudentForm/{studentId}/{formId}/resubmit` with updated fields.
  3. Assert `200 OK`, `resubmissionCount` incremented by 1, status reset to `PendingDeputyWarden`.
  4. Attempt resubmitting an already `Approved` or `Pending` form -> Assert `409 Conflict`.

---

### GROUP 3: Multi-Stage Approval Pipeline & Bulk Operations (WF-HAPPY-04..09; WF-NEG-15..18, 29; WF-BND-14, 15, 22, 23; WF-STATE-01..06, 21, 24; WF-ABU-14, 15, 18, 19)

#### TC-APPR-001 [Positive]: Sequential 3-Stage Approval Flow
- **Target Workflow**: `WF-HAPPY-04, WF-STATE-01, WF-STATE-02, WF-STATE-03`
- **Test Steps**:
  1. Stage 1 (Deputy Warden):
     - `PATCH /api/hostelStaff/staff/deputyWarden/{formId}?action=accept` -> Assert `200 OK`.
     - DB check: `status == "PendingWarden"`, history added.
  2. Stage 2 (Warden):
     - `PATCH /api/hostelStaff/staff/warden/{formId}?action=accept` -> Assert `200 OK`.
     - DB check: `status == "PendingOffice"`, history added.
  3. Stage 3 (Office):
     - `PATCH /api/hostelStaff/staff/office/{formId}?action=accept` -> Assert `200 OK`.
     - DB check: `status == "Approved"`, final student notification generated.

#### TC-APPR-002 [Negative & Boundary]: Double Approval / Concurrency Conflict
- **Target Workflow**: `WF-NEG-15, WF-BND-14, WF-STATE-24`
- **Test Steps**:
  1. Send first `PATCH /api/hostelStaff/staff/deputyWarden/{formId}?action=accept` -> `200 OK`.
  2. Send second identical request concurrently or immediately after -> Assert `409 Conflict` (`InvalidStatusException`).

#### TC-APPR-003 [Negative]: Rejection Without Reason
- **Target Workflow**: `WF-NEG-16, WF-STATE-04..06`
- **Test Steps**:
  1. Send rejection request with empty reason `?action=reject` and `{ "rejectReason": "" }`.
  2. Assert `400 Bad Request`. Verify form remains in pending status.

#### TC-APPR-004 [Positive & Boundary]: Bulk Approvals (500 limit)
- **Target Workflow**: `WF-HAPPY-05..07, WF-BND-22, WF-BND-23, WF-NEG-17, WF-NEG-18`
- **Test Matrix**:
  | Sub-ID | Role | Payload Size | Expected Status | Result Description |
  | :--- | :--- | :--- | :--- | :--- |
  | TC-APPR-004a | Deputy | Empty array `[]` | `400 Bad Request` | `BulkValidationException` |
  | TC-APPR-004b | Deputy | Exactly 500 valid IDs | `200 OK` | All 500 forms transition to `PendingWarden` |
  | TC-APPR-004c | Deputy | 501 IDs | `400 Bad Request` | `BulkValidationException` (exceeds max limit 500) |
  | TC-APPR-004d | Warden | Partial valid (30 valid, 5 already approved) | `200 OK` | Batch progress summary: 30 succeeded, 5 failed/skipped |

#### TC-APPR-005 [Adversarial]: Deputy Scope Enforcement (Gender & Year)
- **Target Workflow**: `WF-ABU-14, WF-ABU-15, WF-ABU-18, WF-ABU-19`
- **Setup**: Deputy A is assigned to `Male, Year 1`. Form X belongs to a `Female, Year 2` student.
- **Test Steps**:
  1. Deputy A calls `PATCH /api/hostelStaff/staff/deputyWarden/{formX_Id}?action=accept`.
  2. Assert `403 Forbidden` or `404 Not Found` (Scope mismatch). Verify form is not modified.

#### TC-APPR-006 [Positive]: Auto-Accept Settings & Trigger Rule
- **Target Workflow**: `WF-HAPPY-08, WF-HAPPY-09, WF-STATE-21`
- **Test Steps**:
  1. Deputy configures auto-accept: `POST /api/hostelStaff/staff/auto-accept` with:
     ```json
     {
       "enabled": true,
       "fromDate": "2026-10-01",
       "toDate": "2026-10-05",
       "year": 2,
       "department": "CSE",
       "reason": "College Festival"
     }
     ```
  2. Student matching `(Year 2, CSE)` submits form for leave date `2026-10-02`.
  3. Assert created form status immediately becomes `PendingWarden` (auto-accepted past Deputy stage).
  4. Assert audit log contains auto-accept tag.

---

### GROUP 4: Administration, Reports & System Operations (WF-HAPPY-11, 13..18; WF-NEG-28, 31..33; WF-STATE-09, 10, 19, 20; WF-ABU-16, 17, 24)

#### TC-ADMIN-001 [Positive]: Admin Student & Staff Management
- **Target Workflow**: `WF-HAPPY-13, WF-HAPPY-14`
- **Test Steps**:
  1. Admin creates student via `POST /api/admin/students` -> Assert `201 Created`.
  2. Admin updates staff credentials via `PUT /api/admin/staff/{id}` -> Assert `200 OK`.
  3. Verify staff can authenticate with new credentials.

#### TC-ADMIN-002 [Positive & Security]: Department Management & Toggle
- **Target Workflow**: `WF-HAPPY-15, WF-NEG-31, WF-STATE-19, WF-STATE-20, WF-ABU-24`
- **Test Steps**:
  1. Create department `POST /api/departments` -> Assert `201 Created`.
  2. Attempt duplicate code creation -> Assert `409 Conflict`.
  3. Toggle department active state `PATCH /api/departments/{id}/toggle` -> Assert `active` flips to `false`.
  4. Fetch `GET /api/departments/active` -> Assert deactivated department is excluded.

#### TC-ADMIN-003 [Adversarial & RBAC]: Admin Endpoint Protection
- **Target Workflow**: `WF-ABU-16, WF-ABU-17, WF-NEG-26..28`
- **Test Matrix**:
  | Sub-ID | Endpoint Called | Actor Token | Expected Response |
  | :--- | :--- | :--- | :--- |
  | TC-ADMIN-003a | `POST /api/admin/truncate-transactional-data` | Warden JWT | `403 Forbidden` |
  | TC-ADMIN-003b | `POST /api/admin/truncate-transactional-data` | Student JWT | `403 Forbidden` |
  | TC-ADMIN-003c | `DELETE /api/hostelStaff/staff/forms/delete-all` | Student JWT | `403 Forbidden` |
  | TC-ADMIN-003d | `PATCH /api/hostelStaff/staff/warden/...` | Admin JWT | `403 Forbidden` (RBAC separation) |

#### TC-ADMIN-004 [Positive]: Transactional Data Truncation
- **Target Workflow**: `WF-HAPPY-18, WF-STATE-09`
- **Preconditions**: DB contains 20 reduction forms, 50 history entries, 30 notifications, 5 students, 3 staff.
- **Test Steps**:
  1. Admin calls `POST /api/admin/truncate-transactional-data`.
  2. Assert `200 OK` with summary counts of deleted rows.
  3. Verify `reduction_form`, `reduction_form_history`, `app_notification`, and `activity_log` counts are 0.
  4. Verify `student_details` and `staff` tables remain completely intact.

#### TC-ADMIN-005 [Positive & Performance]: Office Excel Report Generation
- **Target Workflow**: `WF-HAPPY-11, WF-INT-17`
- **Test Steps**:
  1. Office calls `GET /api/hostelStaff/staff/office/download-report`.
  2. Assert status `200 OK`, `Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`.
  3. Inspect byte stream with Apache POI -> Assert expected headers (`Register No`, `Student Name`, `Leave Date`, `Arrival Date`, `Status`, `Total Days`).

---

### GROUP 5: External Integrations, Background Schedulers & Resilience (WF-INT-01..20; WF-STATE-10, 13, 16..18, 22)

#### TC-INT-001 [Fault Injection]: Hostel Verification API Outages & Timeouts
- **Target Workflow**: `WF-INT-01, WF-INT-02, WF-INT-03, WF-INT-04, WF-INT-15`
- **Test Matrix (WireMock / MockWebServer)**:
  | Sub-ID | Mock External Behavior | Call Under Test | Expected Result |
  | :--- | :--- | :--- | :--- |
  | TC-INT-001a | Return HTTP 503 | `POST /api/auth/verify-hostel` | `503 Service Unavailable`, `StudentVerificationServiceUnavailableException` |
  | TC-INT-001b | 10s Connection Delay (Timeout) | `POST /api/auth/verify-hostel` | `503 Service Unavailable` after timeout elapsed |
  | TC-INT-001c | Return Malformed JSON `{invalid` | `POST /api/auth/verify-hostel` | `503` or `400` with clean error description |
  | TC-INT-001d | Return Match Not Found | `POST /api/auth/verify-hostel` | `400 Bad Request`, `StudentVerificationFailedException` |

#### TC-INT-002 [Fault Injection]: Push Notification & Webhook Fault Tolerance
- **Target Workflow**: `WF-INT-05, WF-INT-06, WF-INT-07, WF-INT-08, WF-STATE-17, WF-STATE-18`
- **Test Steps**:
  1. Mock FCM throwing `FirebaseMessagingException` with invalid token error.
  2. Trigger form submission generating notification.
  3. Assert:
     - Main transaction completes successfully (`201 Created` returned to student).
     - In-app `AppNotification` record is saved.
     - Stale `FcmToken` is cleaned up/removed from DB without cascading failure.

#### TC-INT-003 [Resilience]: Telegram Alerting on Unhandled Exception
- **Target Workflow**: `WF-INT-09, WF-INT-10`
- **Test Steps**:
  1. Simulate DB outage or trigger synthetic `RuntimeException` in an asynchronous listener.
  2. Mock Telegram Bot endpoint returning 429 (Rate limited) or 500.
  3. Assert exception handler logs warning and does not crash the calling thread or re-throw.

#### TC-INT-004 [Scheduler]: Midnight Lazy Reset & Expiry Schedulers
- **Target Workflow**: `WF-STATE-10, WF-STATE-13, WF-STATE-16, WF-STATE-22, WF-BND-04, WF-BND-18`
- **Test Steps**:
  1. Set student submission count to 3 on Date $D$.
  2. Advance system clock or call endpoint on Date $D+1$.
  3. Trigger first request -> Assert `resetSubmissionCountIfNewDay()` runs and resets count to 0.
  4. Trigger `DailyResetScheduler` -> Assert all pending `ExtraSubmissionRequest` rows older than today transition to `EXPIRED`.

---

## 3. Discovered Test Gaps, Ambiguities & Architectural Risks

During test specification analysis of `sathish437/MessReduction`, the following test gaps and system risks were identified:

| ID | Workflow Ref | Issue / Gap Description | Risk Level | Test Strategy / Recommendation |
| :--- | :--- | :--- | :--- | :--- |
| **GAP-01** | `WF-ABU-09` | **Stateless JWT Replay / No Revocation**: Tokens remain valid for 24h even after logout or password change. | **HIGH** | Write test verifying replayed token succeeds; recommend Redis token blacklist or refresh-token rotation. |
| **GAP-02** | `WF-ABU-10, 11` | **Absence of Rate Limiting**: No Spring Security rate limiter or Bucket4j configured for student or staff login endpoints. | **HIGH** | Write load test exercising 500 rapid login requests; verify no throttling currently occurs and flag as security vulnerability. |
| **GAP-03** | `WF-ABU-12, BND-13` | **Race Condition on Submission Count**: If a student fires 10 simultaneous POST requests, `checkSubmissionLimit()` may experience read-commit race. | **MEDIUM** | Implement concurrent `ExecutorService` test with 10 threads hitting `POST /api/student-form/StudentForm/{id}` to test DB lock integrity. |
| **GAP-04** | `WF-BND-08, 28` | **Column Length Boundary Mismatch**: `roomNo` type in DTO vs DB constraints (e.g. `Integer` vs `Long.MAX_VALUE`), and reason length > 1000 chars. | **MEDIUM** | Test database behavior under maximum string lengths to prevent unhandled `DataTruncationException` / 500s. |
| **GAP-05** | `WF-ABU-26, 27` | **Secret Exposure in Source Control**: Credentials in committed `.env` files (DB passwords, Telegram keys, JWT secrets). | **CRITICAL** | Automated CI secret scanner test (`trufflehog` / `gitleaks`) to flag exposed repository secrets. |
| **GAP-06** | `WF-BND-31, 32` | **Timezone Discrepancy**: Server interprets dates in IST (`Asia/Kolkata`), but client dates may serialize without offset. | **MEDIUM** | Execute test suite with JVM timezone configured to UTC (`-Duser.timezone=UTC`) to detect offset shifts. |

---

## 4. Test Harness Implementation Templates

### Sample MockMvc Integration Test (`StudentFormSubmissionTest.java`)

```java
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class StudentFormSubmissionTest {

    @Autowired private MockMvc mockMvc;
    @Autowired private ObjectMapper objectMapper;
    @Autowired private StudentDetailsRepo studentRepo;
    @Autowired private ReductionFormRepo formRepo;

    private String studentToken;
    private Long studentId;

    @BeforeEach
    void setUp() {
        // Seed student with 0 submissions today
        StudentDetails student = createTestStudent("730421104001", "2003-05-15", 2, "Male");
        studentId = student.getId();
        studentToken = generateJwtToken(student.getRegisterNo(), "ROLE_STUDENT");
    }

    @Test
    @DisplayName("WF-HAPPY-03: Submitting valid form creates PendingDeputyWarden status")
    void testSubmitValidForm() throws Exception {
        ReductionFormReqDTO req = new ReductionFormReqDTO();
        req.setYear(2);
        req.setRoomNo(105);
        req.setLeaveDate(LocalDate.now().plusDays(1));
        req.setLeaveTime("09:00");
        req.setArrivalDate(LocalDate.now().plusDays(4));
        req.setArrivalTime("18:00");
        req.setReason("Attending technical symposium");

        mockMvc.perform(post("/api/student-form/StudentForm/" + studentId)
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + studentToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.status").value("PendingDeputyWarden"))
                .andExpect(jsonPath("$.id").isNotEmpty());
    }

    @Test
    @DisplayName("WF-NEG-10: Arrival before leave date rejected with 400 Bad Request")
    void testArrivalBeforeLeaveDate() throws Exception {
        ReductionFormReqDTO req = new ReductionFormReqDTO();
        req.setYear(2);
        req.setRoomNo(105);
        req.setLeaveDate(LocalDate.now().plusDays(5));
        req.setArrivalDate(LocalDate.now().plusDays(2));
        req.setReason("Invalid dates");

        mockMvc.perform(post("/api/student-form/StudentForm/" + studentId)
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + studentToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isBadRequest());
    }
}
```

---
*Generated by Agent 2 (Test Writer) for MessReduction.*
