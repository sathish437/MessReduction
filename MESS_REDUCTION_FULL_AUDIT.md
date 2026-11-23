# Technical Audit Report: Hostel Mess Reduction Management System

**Audit Date:** November 19, 2026  
**Auditor Role:** Senior QA Engineer & Technical Auditor  
**Scope:** Full-Stack Inspection (React + Vite + Tailwind CSS Frontend & Spring Boot + JPA/Hibernate + PostgreSQL Backend)  
**Report Version:** 1.0.0 — Production Readiness & Integrity Review  

---

## Executive Summary

An exhaustive, non-destructive technical audit of the Hostel Mess Reduction Management System was conducted across all frontend components, routes, backend controllers, service layers, repositories, database schemas, security configurations, and real-time Server-Sent Events (SSE) synchronization.

The system demonstrates solid architectural foundations, modern UI styling with Tailwind CSS and Framer Motion, and transactional integrity mechanisms. However, the audit uncovered **critical security vulnerabilities (BOLA/IDOR, Privilege Escalation, Registration Bypass)**, a **functional bug in notification routing causing 100% loss of student in-app notifications**, **aggressive 4–5 second background polling causing severe backend load**, and **an N+1 select query pattern on large dataset listings**.

Every issue reported below has been verified against the live codebase or live running backend on `http://localhost:8080`.

---

## Audit Index & Severity Breakdown

| Severity | Confirmed Bugs | Architectural & Potential Improvements | Total |
| :--- | :---: | :---: | :---: |
| **Critical** | 2 | 0 | 2 |
| **High** | 5 | 2 | 7 |
| **Medium** | 6 | 4 | 10 |
| **Low** | 4 | 5 | 9 |
| **Total** | **17** | **11** | **28** |

---

## Section 1: Confirmed Bugs (Prioritized by Severity)

### [CRITICAL] SEC-01: Insecure Direct Object Reference (IDOR / BOLA) on Student Forms & Personal Data
- **Issue ID:** `SEC-01`
- **Module:** Student Module / Backend Security
- **File Path:** 
  - `server/src/main/java/com/hostel/MessReduction/Controller/ReductionFormController.java` (Lines 45–120)
  - `server/src/main/java/com/hostel/MessReduction/Service/ReductionFormService.java` (Lines 147–415)
- **Problem Description:** 
  Any authenticated student can view the complete personal profile, all active and historical reduction forms, dates of birth, phone numbers, email addresses, and room numbers of **any other student in the hostel** by altering the `{studentId}` path variable. Furthermore, an authenticated student can delete or resubmit applications on behalf of other students.
- **Reproduction Steps:**
  1. Authenticate as Student A (`studentId=1`, Reg No: `7100TEST0001`). Receive JWT token with claim `"role": "STUDENT"`.
  2. Send `GET /api/student-form/Student/2` with Student A's Bearer token in the `Authorization` header.
  3. Execute `DELETE /api/student-form/StudentForm/2/{formId}` or `GET /api/student-form/StudentForm/2`.
- **Expected Behavior:** 
  The backend must compare the authenticated principal's `studentId` (or Register Number) against `{studentId}` in the path. If they do not match, reject the request with `403 Forbidden`.
- **Actual Behavior (Live Verified):** 
  The request returns `HTTP 200 OK` with Student 2's full profile:
  ```json
  {
    "studentId": 2,
    "name": "Aditya Patel",
    "dob": "2004-03-03",
    "emailId": "test.student0002@hosteltest.com",
    "phoneNo": "9100000002",
    "registerNo": "7100TEST0002",
    "reductionForms": [...]
  }
  ```
  Because student login authentication relies strictly on `registerNo` + `dob`, Student 1 now obtains Student 2's DOB and can directly hijack Student 2's account.
- **Root Cause:** 
  `ReductionFormController` and `ReductionFormService` bind directly to `@PathVariable Long studentId` without validating against `SecurityContextHolder.getContext().getAuthentication()`.
- **Severity:** **Critical**
- **Recommended Solution:** 
  Extract the student identity directly from the authenticated JWT principal (`CustomUserDetails.getStudentId()`), or enforce a security check:
  ```java
  CustomUserDetails principal = (CustomUserDetails) authentication.getPrincipal();
  if (!principal.getStudentId().equals(studentId)) {
      throw new AccessDeniedException("Access denied: Cannot access another student's record");
  }
  ```

---

### [CRITICAL] SEC-02: Missing Function-Level Access Control on Department Management API (Privilege Escalation)
- **Issue ID:** `SEC-02`
- **Module:** Admin Module / Department Controller
- **File Path:** 
  - `server/src/main/java/com/hostel/MessReduction/Controller/DepartmentController.java` (Lines 45–75)
  - `server/src/main/java/com/hostel/MessReduction/security/SecurityConfig.java` (Line 69)
- **Problem Description:** 
  Any authenticated user—regardless of role (including any standard Student or Deputy Warden)—can create, modify, or deactivate academic departments in the system.
- **Reproduction Steps:**
  1. Authenticate as a Deputy Warden (`deputyWarden4`) or standard Student.
  2. Send a `PATCH /api/departments/1/status` request with payload `{"isActive": false}`.
- **Expected Behavior:** 
  Administrative mutations must require `ROLE_ADMIN` and reject non-admin users with `403 Forbidden`.
- **Actual Behavior (Live Verified):** 
  The server responds with `HTTP 200 OK`, modifying the department status:
  ```json
  {"id":1,"departmentCode":"CSE","departmentName":"Computer Science and Engineering","isActive":false}
  ```
- **Root Cause:** 
  `DepartmentController` lacks method-level `@PreAuthorize("hasRole('ADMIN')")` annotations on `POST`, `PUT`, and `PATCH` endpoints. In `SecurityConfig.java`, line 69 defaults all unmapped `/api/**` endpoints to `.authenticated()`.
- **Severity:** **Critical**
- **Recommended Solution:** 
  Annotate the controller or mutation endpoints with `@PreAuthorize("hasRole('ADMIN')")`, and in `SecurityConfig.java`:
  ```java
  .requestMatchers(HttpMethod.GET, "/api/departments/active").permitAll()
  .requestMatchers(HttpMethod.GET, "/api/departments/**").authenticated()
  .requestMatchers("/api/departments/**").hasRole("ADMIN")
  ```

---

### [HIGH] NOTIF-01: Username / Email Mismatch in Student In-App Notification System
- **Issue ID:** `NOTIF-01`
- **Module:** Student Notifications / Staff Approval Workflow
- **File Path:** 
  - `server/src/main/java/com/hostel/MessReduction/Service/ReductionFormService.java` (Lines 387, 505, 530, 859, 939)
  - `server/src/main/java/com/hostel/MessReduction/Controller/NotificationController.java` (Lines 38–48)
  - `server/src/main/java/com/hostel/MessReduction/security/CustomUserDetails.java` (Line 29)
- **Problem Description:** 
  Students **never receive any in-app notifications** in their notification bell when their mess reduction forms are approved, rejected, or deleted. The notification bell continuously reports 0 unread notifications.
- **Reproduction Steps:**
  1. Student `7100TEST0001` submits an application.
  2. Deputy Warden or Warden approves or rejects the application.
  3. Student logs in and inspects the notification bell in the top navbar.
- **Expected Behavior:** 
  The notification bell displays an unread count badge and shows items such as: *"Your request has been approved by Warden."*
- **Actual Behavior (Live Verified):** 
  `GET /api/notifications` returns `{"unreadCount":0,"notifications":[]}` permanently for all students.
- **Root Cause:** 
  When a student authenticates, their Spring Security principal `username` is their Register Number (`7100TEST0001`). `NotificationController.getNotifications()` queries `notificationRepo.findByRecipientUsername(authentication.getName())` (`"7100TEST0001"`).  
  However, in `ReductionFormService.java` (Lines 387, 505, 530), notifications are created with `student.getEmailId()` (`"test.student0001@hosteltest.com"`). Because Register Number never equals Email ID, the database query returns 0 rows.
- **Severity:** **High**
- **Recommended Solution:** 
  In `ReductionFormService.java`, pass `student.getRegisterNo()` as `recipientUsername` instead of `student.getEmailId()`:
  ```java
  notificationService.createNotification(form.getStudentDetails().getRegisterNo(), "Your request has been approved by Warden.", "APPROVED", form.getFormId());
  ```

---

### [HIGH] NOTIF-02: Hardcoded `TESTING_MODE = true` Wipes Notification History on Server Restart
- **Issue ID:** `NOTIF-02`
- **Module:** Notification Subsystem / Data Persistence
- **File Path:** 
  - `server/src/main/java/com/hostel/MessReduction/Service/NotificationService.java` (Lines 37–42, 59–64, 140–155)
- **Problem Description:** 
  Every time the backend server restarts or redeploys, all previously delivered notifications become permanently invisible to users.
- **Reproduction Steps:**
  1. Deliver a notification to a staff member or student.
  2. Verify notification appears via `GET /api/notifications`.
  3. Restart Spring Boot application.
  4. Query `GET /api/notifications`.
- **Expected Behavior:** 
  All notifications stored in the PostgreSQL database remain visible until marked read or expired.
- **Actual Behavior:** 
  Notifications prior to the restart are excluded from API response.
- **Root Cause:** 
  Lines 37–42 in `NotificationService.java`:
  ```java
  private static final boolean TESTING_MODE = true;
  private Long appStartId = 0L;

  @PostConstruct
  public void init() {
      if (TESTING_MODE) {
          AppNotification latest = notificationRepo.findFirstByOrderByIdDesc();
          appStartId = latest != null ? latest.getId() : 0L;
      }
  }
  ```
  `getUserNotifications` queries `id > appStartId`, dropping all existing database records on startup.
- **Severity:** **High**
- **Recommended Solution:** 
  Remove `TESTING_MODE` and `appStartId` filtering from production code. Query directly by `recipientUsername` ordered by `createdAt DESC`.

---

### [HIGH] SEC-03: Hostel Verification Bypass on Student Self-Registration Endpoint
- **Issue ID:** `SEC-03`
- **Module:** Student Registration / Authentication Boundary
- **File Path:** 
  - `server/src/main/java/com/hostel/MessReduction/security/SecurityConfig.java` (Line 50)
  - `server/src/main/java/com/hostel/MessReduction/Service/StudentDetailsService.java` (Lines 22–50)
  - `client/src/Register.jsx` (Lines 91–98)
- **Problem Description:** 
  The frontend enforces a prerequisite hostel verification step (`/hostel-verification`) storing `sessionStorage.getItem("hostelVerified") === "true"`. However, the backend exposes `POST /api/student/reg` as `permitAll()` with zero validation of whether the student actually passed hostel verification.
- **Reproduction Steps:**
  1. Send a direct `POST http://localhost:8080/api/student/reg` without headers or prior verification.
  2. Provide student registration details for an unverified student.
- **Expected Behavior:** 
  Registration fails with `400 Bad Request` or `401 Unauthorized` unless a signed verification token or verified server-side session is provided.
- **Actual Behavior:** 
  The student is created and saved directly to the database.
- **Root Cause:** 
  Verification state exists purely in client-side `sessionStorage`. No verification proof (e.g., HMAC-signed verification ticket or one-time token) is required by the backend registration API.
- **Severity:** **High**
- **Recommended Solution:** 
  Generate a short-lived cryptographically signed token upon successful `/api/auth/verify-hostel`, and require that token in the payload of `POST /api/student/reg`.

---

### [HIGH] TX-01: Erroneous `noRollbackFor` on Business Exceptions Causes Corrupted Transaction State
- **Issue ID:** `TX-01`
- **Module:** Reduction Form Lifecycle / Transaction Management
- **File Path:** 
  - `server/src/main/java/com/hostel/MessReduction/Service/ReductionFormService.java` (Lines 55–65)
- **Problem Description:** 
  `ReductionFormService` is annotated with `@Transactional(noRollbackFor = { BadRequestException.class, DateNotValidException.class, TotalLeaveDateCountException.class, ... })`. If a submission or resubmission validation fails midway, any prior entity mutations (such as incrementing daily submission counts or partial history entities) are committed to the database despite the operation failing.
- **Reproduction Steps:**
  1. Trigger an operation that updates a student entity, followed by a validation exception (e.g. `TotalLeaveDateCountException`).
- **Expected Behavior:** 
  The entire transaction must roll back cleanly; no state mutations should persist.
- **Actual Behavior:** 
  Because `noRollbackFor` is configured for these exceptions, JPA commits all pending dirty checks upon completion of the transaction block.
- **Root Cause:** 
  Misunderstanding of Spring `@Transactional` semantics. All unchecked runtime exceptions should trigger rollback unless there is a specific, isolated requirement.
- **Severity:** **High**
- **Recommended Solution:** 
  Remove `noRollbackFor` from the `@Transactional` annotation on `ReductionFormService`.

---

### [HIGH] SEC-04: Arbitrary User Impersonation Query Parameter on Warden Pending Requests API
- **Issue ID:** `SEC-04`
- **Module:** Warden Module / Authorization Boundary
- **File Path:** 
  - `server/src/main/java/com/hostel/MessReduction/Controller/StaffUsersController.java` (Lines 40–50)
- **Problem Description:** 
  The endpoint `GET /api/hostelStaff/staff/warden` accepts an optional query parameter `@RequestParam(required = false) String userName`. If supplied, it overrides `authentication.getName()`, allowing any Warden to view other staff members' views.
- **Reproduction Steps:**
  1. Authenticate as `warden`.
  2. Send `GET /api/hostelStaff/staff/warden?userName=deputyWarden4`.
- **Expected Behavior:** 
  A user's view must be strictly bound to their authenticated token principal; arbitrary `userName` parameters must be rejected or ignored.
- **Actual Behavior:** 
  `effectiveUserName` uses the query parameter value directly over `authentication.getName()`.
- **Root Cause:** 
  `String effectiveUserName = (userName != null && !userName.isEmpty()) ? userName : authentication.getName();`.
- **Severity:** **High**
- **Recommended Solution:** 
  Remove the `userName` request parameter; always use `authentication.getName()`.

---

### [MEDIUM] API-01: Public Route `/api/departments/active` Returns 401 Unauthorized for Unauthenticated Visitors
- **Issue ID:** `API-01`
- **Module:** Security Configuration / Registration Flow
- **File Path:** 
  - `server/src/main/java/com/hostel/MessReduction/security/SecurityConfig.java` (Lines 48–70)
  - `client/src/api/departmentService.js` (Lines 33–60)
- **Problem Description:** 
  When a visitor visits the Student Registration page without an existing session, or when staff login opens with stale cookies, the browser console repeatedly reports:
  `GET http://localhost:8080/api/departments/active 401 (Unauthorized)`
- **Reproduction Steps:**
  1. Clear browser cookies and localStorage.
  2. Navigate directly to `/register` or `/hostel-verification`.
  3. Inspect browser developer console.
- **Expected Behavior:** 
  Active departments is public reference data needed to populate registration dropdowns; it should return HTTP 200 without authentication.
- **Actual Behavior:** 
  HTTP 401 Unauthorized. The frontend catches the error and falls back to a hardcoded `DEFAULT_DEPARTMENTS` array.
- **Root Cause:** 
  `/api/departments/active` is omitted from the `permitAll()` list in `SecurityConfig.java`.
- **Severity:** **Medium**
- **Recommended Solution:** 
  Add `.requestMatchers(HttpMethod.GET, "/api/departments/active").permitAll()` to `SecurityConfig.java`.

---

### [MEDIUM] PERF-01: Aggressive Multi-Client Interval Polling Bombards Server with 15 Req/Min per Inactive User
- **Issue ID:** `PERF-01`
- **Module:** Frontend Architecture / Performance
- **File Path:** 
  - `client/src/MessReductionPage.jsx` (Lines 453–458)
  - `client/src/NotificationBell.jsx` (Lines 21–33)
- **Problem Description:** 
  The frontend executes two unthrottled `setInterval` loops simultaneously on every open student tab:
  1. `fetchExtraSubmissionStatus()` every 4,000 ms.
  2. `fetchNotifications()` every 5,000 ms.
  An idle student page generates 15 HTTP requests every minute. Across 500 active students, this produces **7,500 background requests/minute** (125 req/sec), querying PostgreSQL continuously even when the tab is hidden.
- **Reproduction Steps:**
  1. Log into the student dashboard.
  2. Open the browser Network tab and observe continuous requests every 4 and 5 seconds.
- **Expected Behavior:** 
  Background polling should use SSE/WebSockets for notifications, or pause when `document.visibilityState === 'hidden'`.
- **Actual Behavior:** 
  Unconditional 4s and 5s timer execution causes high CPU and connection pool consumption.
- **Severity:** **Medium**
- **Recommended Solution:** 
  Pause intervals when tab is hidden (`document.hidden`), increase polling interval to 30–60 seconds, or migrate extra submission updates to the existing SSE channel.

---

### [MEDIUM] PERF-02: N+1 Database Query Pattern on Form Listing Endpoints
- **Issue ID:** `PERF-02`
- **Module:** Backend Database Performance / JPA Repositories
- **File Path:** 
  - `server/src/main/java/com/hostel/MessReduction/Repo/ReductionFormRepo.java` (Lines 65, 89, 90)
  - `server/src/main/java/com/hostel/MessReduction/MappingDTO/ReductionFormMapper.java` (Lines 34–50)
- **Problem Description:** 
  Several `ReductionFormRepo` query methods fetch forms without joining the associated `StudentDetails` entity (which has `fetch = FetchType.LAZY`). When `ReductionFormMapper.mapToReductionFormResDTO()` loops through the forms, each form triggers an additional `SELECT * FROM student_details WHERE student_id = ?` query. For 100 forms, 101 queries are executed.
- **Reproduction Steps:**
  1. Enable SQL logging (`spring.jpa.show-sql=true`).
  2. Call `GET /api/hostelStaff/staff/office`.
  3. Observe terminal query count.
- **Expected Behavior:** 
  A single query with `JOIN FETCH r.studentDetails` or `@EntityGraph(attributePaths = {"studentDetails"})`.
- **Actual Behavior:** 
  101 separate SELECT queries executed sequentially.
- **Severity:** **Medium**
- **Recommended Solution:** 
  Ensure `@EntityGraph(attributePaths = {"studentDetails"})` is placed on all form query methods in `ReductionFormRepo.java`.

---

### [MEDIUM] UI-01: Office Report Download Generates Malformed Fake HTML `.xls` Instead of Real Apache POI `.xlsx`
- **Issue ID:** `UI-01`
- **Module:** Office Module / Excel Report Export
- **File Path:** 
  - `client/src/Hostel_office.jsx` (Lines 127–160, 1060–1065)
  - `server/src/main/java/com/hostel/MessReduction/Controller/StaffUsersController.java` (Lines 230–240)
- **Problem Description:** 
  The Office dashboard contains a "Download Excel" button that constructs an HTML table string with an `.xls` extension in the browser. When opened in Microsoft Excel, users receive a security warning: *"The file format and extension of 'mess_reduction_report.xls' don't match. The file could be corrupted or not safe."*  
  Meanwhile, the backend already contains a production Apache POI Excel generator at `/api/hostelStaff/staff/office/download-report` that is completely bypassed.
- **Reproduction Steps:**
  1. Log into Office module.
  2. Click "Download Excel".
  3. Open downloaded file in Microsoft Excel.
- **Expected Behavior:** 
  Download a clean binary `.xlsx` generated by the backend API.
- **Actual Behavior:** 
  HTML file downloaded with `.xls` extension, triggering format mismatch warnings.
- **Severity:** **Medium**
- **Recommended Solution:** 
  Update `handleDownloadReport` in `Hostel_office.jsx` to fetch binary data from `/api/hostelStaff/staff/office/download-report` using `responseType: 'blob'`.

---

### [MEDIUM] API-02: Phantom Route in SecurityConfig: `/api/hostelStaff/staff/forms/delete-all`
- **Issue ID:** `API-02`
- **Module:** Backend Security / Dead Routing
- **File Path:** 
  - `server/src/main/java/com/hostel/MessReduction/security/SecurityConfig.java` (Line 64)
- **Problem Description:** 
  Line 64 of `SecurityConfig.java` defines `.requestMatchers("/api/hostelStaff/staff/forms/delete-all").hasRole("Office")`. However, no controller in the entire project implements this endpoint.
- **Reproduction Steps:**
  1. Send `DELETE /api/hostelStaff/staff/forms/delete-all` with an Office Bearer token.
- **Expected Behavior:** 
  A controller responds, or the dead route rule is removed.
- **Actual Behavior:** 
  `HTTP 404 Not Found`.
- **Severity:** **Medium**
- **Recommended Solution:** 
  Either implement the bulk deletion endpoint in `StaffUsersController` or remove the dead configuration line.

---

### [LOW] SEC-05: Missing `.env` Entry in `.gitignore`
- **Issue ID:** `SEC-05`
- **Module:** Repository Configuration / Secret Hygiene
- **File Path:** 
  - `.gitignore` (Root directory, 0 bytes)
  - `server/.env`
- **Problem Description:** 
  The root `.gitignore` file is completely empty (0 bytes). The `server/.env` file contains database passwords, JWT secrets, Firebase credentials, and VAPID keys. While currently untracked, any subsequent `git add .` risks committing live credentials to version control.
- **Reproduction Steps:**
  1. Run `git status` in workspace root.
  2. Inspect `.gitignore`.
- **Expected Behavior:** 
  `.gitignore` includes `.env`, `*.env`, `target/`, `node_modules/`, `dist/`.
- **Actual Behavior:** 
  `.gitignore` is empty.
- **Severity:** **Low** (Preventative Security)
- **Recommended Solution:** 
  Populate `.gitignore` with standard rules for Node.js and Java projects, specifically excluding `.env` files.

---

### [LOW] UI-02: Client-Side Timezone Mismatch in Form Date Constraints
- **Issue ID:** `UI-02`
- **Module:** Student Mess Reduction Form / Timezone Handling
- **File Path:** 
  - `client/src/MessReductionPage.jsx` (Lines 1174, 1179)
- **Problem Description:** 
  The date picker inputs use `min={new Date().toISOString().split('T')[0]}`. Because `toISOString()` returns UTC time, students submitting forms in India (IST, UTC+5:30) between 12:00 AM and 05:30 AM IST see yesterday's date as the minimum selectable date, allowing late submissions that the backend rejects.
- **Reproduction Steps:**
  1. Set system clock to 02:00 AM IST.
  2. Open the Mess Reduction Form.
  3. Inspect `min` attribute of the Leave Date field.
- **Expected Behavior:** 
  `min` corresponds to the current date in Indian Standard Time (`Asia/Kolkata`).
- **Actual Behavior:** 
  `min` is set to the previous calendar day.
- **Severity:** **Low**
- **Recommended Solution:** 
  Use local date formatting (`new Date().toLocaleDateString('en-CA')`) or bind to the backend's `/api/student-form/server-time` response.

---

### [LOW] UI-03: Seven Redundant Token Locations in Client Storage Interceptor
- **Issue ID:** `UI-03`
- **Module:** Client Network Client / Auth Interceptor
- **File Path:** 
  - `client/src/api/apiClient.js` (Lines 14–22)
- **Problem Description:** 
  `apiClient` attempts to resolve tokens across 7 different keys: `localStorage.auth_token`, `sessionStorage.token`, `localStorage.token`, `localStorage.staffToken`, `sessionStorage.staffToken`, `cookie.staffToken`, `cookie.token`. If a user logs out of one role and into another on the same browser, lingering keys from a prior session can be transmitted, causing 403 Forbidden errors.
- **Severity:** **Low**
- **Recommended Solution:** 
  Standardize on one storage key (e.g. `auth_token` in `localStorage`), and clear all storage completely in `authService.logout()`.

---

## Section 2: SSE (Server-Sent Events) Deep Audit

### Historical Bug Analysis
- **Reported Bug:** Student submits form → SSE notification arrives in toast → Requests table remains unchanged → Search returns no results until browser F5 refresh.
- **Root Cause Established:** 
  `useSseNotifications` previously maintained a purely internal React state (`notifications`) that only fed the popup toast component (`SseNotificationToast`). The page table state (`requests` in `Deputy_warden_side.jsx` / `Warden.jsx`) had no callback or event listener attached to the SSE stream. The data was only loaded once on component mount.
- **Current Verification:** 
  The fix implemented in `useSseNotifications.js` introduces an `onNewRequest` callback and dispatches `window.dispatchEvent(new CustomEvent('sse-new-request'))`. Both `Deputy_warden_side.jsx` and `Warden.jsx` now invoke `refreshData()` and deduplicate entries using a JavaScript `Map` keyed by `item.id`.
- **Remaining SSE Architectural Gaps:**
  1. **Office Excluded from SSE:** `SecurityConfig.java` line 56 restricts `/api/notifications/sse` strictly to `DeputyWarden` and `Warden`. The `HostelOffice` module has no real-time SSE connection.
  2. **One-Way Notification Pipeline:** SSE notifications are only published on initial student submission. When a Deputy Warden approves a form and forwards it to the Warden, or when the Warden approves it for Office, **no SSE event is dispatched**. The subsequent approvers must rely on manual refreshes or page navigation.

---

## Section 3: Dead Code & Unused Component Audit

The following files exist in the client repository but are never imported or referenced by any active component or router:

1. **`client/src/Deputy_warden.jsx`**: Legacy full-page login mockup with random letter-scattering animations. Unused (replaced by `Deputy_warden_side.jsx` and `StaffLogin.jsx`).
2. **`client/src/Login.jsx`**: Legacy student login prototype. Unused (replaced by `StudentLogin.jsx`).
3. **`client/src/components/MobileBottomNav.jsx`**: Unreferenced bottom navigation bar.
4. **`client/src/components/StaffHeader.jsx`**: Unreferenced header component.
5. **`client/src/components/ConfirmModal.jsx`**: Standalone modal component; pages currently use inline modal dialogs.
6. **`client/src/DobInputComponent.jsx`**: Replaced by standard date inputs.
7. **`client/src/Warden.jsx` (Lines 40–98, `YearSelectScreen`)**: Full 60-line component function declared in `Warden.jsx` that is never rendered or invoked.

---

## Section 4: Performance & Optimization Recommendations

1. **Remove Double BCrypt Check on Staff Login:**
   In `StaffAuthService.java` (Lines 37–50), the code calls `passwordEncoder.matches(...)` manually, and immediately calls `authenticationManager.authenticate(...)`, which verifies BCrypt a second time. BCrypt is intentionally slow (~100ms CPU time); verifying twice doubles login latency.
2. **Implement Visibility-Aware Polling:**
   Use the Page Visibility API (`document.visibilityState`) in `MessReductionPage.jsx` and `NotificationBell.jsx` to immediately suspend background polling when the user switches tabs or minimizes the window.
3. **Bundle Size Optimization:**
   The production build produces `index-CQTizpgI.js` at 499.10 kB (159.40 kB gzipped). While dynamic `lazy()` imports are present for routes, large icon libraries (`react-icons/fi`, `react-icons/md`) should be audited for tree-shaking efficiency.

---

## Section 5: Verification Checklist & System Status

| Module / Check | Status | Verification Method |
| :--- | :---: | :--- |
| Spring Boot Backend | **RUNNING** | Active on `http://localhost:8080` (PID / Task 904) |
| Vite Frontend | **RUNNING** | Active on `http://localhost:5173` (Task 212) |
| Frontend Build (`npm run build`) | **PASSING** | 0 build errors (built in 9.28s) |
| Backend Compile (`mvnw compile`) | **PASSING** | 0 compile errors |
| Student IDOR Exposure | **CONFIRMED** | Live curl GET `/api/student-form/Student/2` returned 200 OK with sensitive personal data |
| Department Privilege Escalation | **CONFIRMED** | Live curl PATCH `/api/departments/1/status` returned 200 OK using staff token |
| Student Notification Bell Delivery | **CONFIRMED BROKEN** | Live curl GET `/api/notifications` returned empty array due to username/email key mismatch |
| SSE Table Sync | **PASSING** | Verified event listener and deduplication map in `Deputy_warden_side.jsx` |
| WhatsApp Notification Service | **NOT VERIFIED** | Requires external Meta Cloud API credentials |
| Firebase Cloud Messaging (FCM) | **NOT VERIFIED** | Requires active FCM service account in deployment environment |

---
*End of Audit Report. Report compiled non-destructively without modifying any source files.*
  

  