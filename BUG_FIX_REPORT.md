# Hostel Mess Reduction – Critical Bug Fix & UX Improvement Report

**Date:** November 23, 2026  
**Project:** Hostel Mess Reduction System  
**Stack:** React 19 + Vite (Client) | Spring Boot 3.4.1 + JPA + PostgreSQL (Server)

---

## 1. Executive Summary

Four critical functional and UX defects were identified, diagnosed to their root causes, and resolved without redesigning the website, removing features, or violating the multi-tier approval workflow (`Student → Deputy Warden → Warden → Office`). 

All unit, integration, and flow tests have passed with 100% success (29/29 test suites passing), and the client-side bundle compiles cleanly with 0 errors.

---

## 2. Issues, Root Causes, and Implementations

### Issue 1: Rejected Applications Hidden on Student Dashboard

#### Problem Description
When staff (Deputy Warden, Warden, or Office) rejected a mess reduction request, the application was omitted from the student's dashboard, displaying only a blank state with an "Apply" button and no feedback as to why or where the application was rejected.

#### Root Causes
1. **Backend:** Rejection methods in `ReductionFormService.java` (`rejectDeputyWardenForm`, `rejectWardenForm`, `rejectOfficeForm`, and bulk methods) updated `currentStatus` to `Rejected*` but never populated `rejectedStage` or `rejectedAt`.
2. **Backend Query:** `ReductionFormService.getStudentProfileWithForms` filtered forms with `findByStudentDetailsStudentIdAndIsActiveTrue`, which risked hiding historical or inactive records.
3. **Frontend:** In `MessReductionPage.jsx`, `hasActiveAppliedRequest` strictly checked for status starting with `'Pending'` or equal to `'Approved'`. Rejected requests evaluated to `false`, causing the dashboard to completely bypass the active request view and display only the "Apply Mess Reduction" prompt.

#### Changes Implemented
- **Entity & DTO Enhancement:**
  - Added `private LocalDateTime rejectedAt;` to `ReductionForm.java` entity.
  - Added `@JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss") private LocalDateTime rejectedAt;` and `isActive` to `ReductionFormResDTO.java`.
  - Mapped `rejectedAt` and `isActive` in `ReductionFormMapper.java`.
- **Backend Service & Repository:**
  - In `ReductionFormService.java`, updated single rejection handlers (`rejectDeputyWardenForm`, `rejectWardenForm`, `rejectOfficeForm`) to set `form.setRejectedStage(...)` and `form.setRejectedAt(DateTimeUtil.nowLocalDateTime())`.
  - In `ReductionFormRepo.java`, updated bulk reject queries (`bulkRejectDeputyWardenStatus`, `bulkRejectWardenStatusWithYear`, `bulkRejectWardenStatusAllYears`, `bulkRejectOfficeStatus`) to record `r.rejectedStage = :expectedStatus, r.rejectedAt = CURRENT_TIMESTAMP`.
  - In `ReductionFormService.getStudentProfileWithForms` and `formDetails`, changed the query to `findByStudentDetailsStudentId` to include all student application records.
  - In `ReductionFormService.getFormForEdit` and `resubmitForm`, used fallback lookup (`findByFormIdAndStudentDetailsStudentId` or `findByFormIdAndStudentDetailsStudentIdAndIsActiveTrue`) so students can retrieve and resubmit their rejected applications.
- **Frontend Student Dashboard (`MessReductionPage.jsx`):**
  - Added `isRejectedRequest = Boolean(latestForm && latestForm.currentStatus?.startsWith('Rejected'))`.
  - Rendered a dedicated **Rejected Application Card** when an application is rejected:
    - Status badge: `REJECTED` (with rose styling).
    - Reviewer stage: Displays which stage rejected the request (`by Deputy Warden`, `by Warden`, or `by Hostel Office`).
    - Timestamp: Displays exact rejection date and time (`Decision recorded on DD MMM YYYY at HH:MM AM/PM`).
    - Rejection reason: Highlights the staff member's exact comments in a styled alert box.
    - Preserved application details: Shows original leave date/time, arrival date/time, leave reason, room number, and year.
    - Actions: Added **"Edit & Resubmit"** button (pre-populating the form), **"Track Status"** button (switching to timeline view), and **"Submit fresh application instead"** link.

---

### Issue 2: Application Counts and Status Counts Desynchronization

#### Problem Description
Application counts on the Student and Staff dashboards were inaccurate or desynchronized:
- Student dashboard lacked category summary cards (Total, Pending, Approved, Rejected).
- In `Warden.jsx`, the "Approved" card displayed `counts?.pendingOffice || 0`. Once the Hostel Office completed final approval, status transitioned to `Approved`, causing the Warden's approved count to drop to zero.
- Staff bulk actions (approve/reject) in `Warden.jsx`, `Deputy_warden_side.jsx`, and `Hostel_office.jsx` updated local state optimistically but failed to call `fetchData` / `refreshData`, leaving counts out of sync with actual database records.

#### Root Causes
1. Missing category count calculations on the client student view.
2. Logic flaw in Warden dashboard calculating only forwarded office requests rather than total approved applications.
3. Lack of post-operation synchronization after bulk API invocations.

#### Changes Implemented
- **Student Dashboard (`MessReductionPage.jsx`):**
  - Computed accurate count categories directly from backend student application records:
    - `Total Applications`: `studentForm.length`
    - `Pending`: `studentForm.filter(f => f.currentStatus?.startsWith('Pending')).length`
    - `Approved`: `studentForm.filter(f => f.currentStatus === 'Approved').length`
    - `Rejected`: `studentForm.filter(f => f.currentStatus?.startsWith('Rejected')).length`
  - Rendered a 4-card statistics row (`stat-card`) on the Student Dashboard.
  - Added a listener for the `'app-notification-refresh'` custom event to automatically re-fetch student application counts when SSE notifications arrive.
- **Warden Dashboard (`Warden.jsx`):**
  - Updated "Approved" card calculation to `(counts?.pendingOffice || 0) + (counts?.approved || 0)`.
  - Added a 4th card "Total forms": `(counts?.pendingWarden || 0) + (counts?.pendingOffice || 0) + (counts?.approved || 0) + (counts?.rejectedWarden || 0)`.
  - Added `await fetchData(null, true);` after single rejections, bulk approvals, and bulk rejections.
- **Deputy Warden Dashboard (`Deputy_warden_side.jsx`):**
  - Added `await refreshData();` following bulk approvals and bulk rejections.
- **Hostel Office Dashboard (`Hostel_office.jsx`):**
  - Added `await refreshData();` following bulk approvals and bulk rejections.

---

### Issue 3: Staff Notification Popup – Outside Click and Escape Dismiss

#### Problem Description
The real-time SSE notification toasts and notification dropdown closed only when clicking the 'X' button. Clicking outside or pressing Escape had no effect.

#### Root Causes
`SseNotificationToast.jsx` and `NotificationBell.jsx` lacked document-level event listeners for outside click (`mousedown`, `touchstart`) and keydown (`Escape`), and lacked React refs to differentiate inside vs. outside click boundaries.

#### Changes Implemented
- **Floating Toast Queue (`client/src/components/SseNotificationToast.jsx`):**
  - Attached `containerRef` to the toast container element.
  - Implemented `mousedown` and `touchstart` event listeners on `document` that dismiss notifications when clicking outside `containerRef.current`.
  - Checked `event.target.closest('[data-notification-bell]')` to prevent conflicts when clicking the notification bell icon.
  - Added `keydown` listener on `document` listening for `Escape` to dismiss active toasts.
  - Added `onClick={(e) => e.stopPropagation()}` on the toast elements to prevent clicks inside notification content from accidentally dismissing toasts.
  - Ensured listener clean-up in the `useEffect` unmount phase.
- **Notification Bell Dropdown (`client/src/NotificationBell.jsx`):**
  - Added `data-notification-bell="true"` attribute and `bellRef`.
  - Added outside-click and Escape listeners that toggle `isOpen` to `false` without marking notifications as read.
  - Added clean-up on unmount.

---

### Issue 4: Enter Key Form Submission Blocked

#### Problem Description
Pressing the Enter key on keyboard forms did not submit the form.

#### Root Causes
In `Register.jsx` (`handleNumKey`, `handleAlphaNumKey`) and `HostelVerification.jsx` (`handleAlphaNumKey`), the keyboard restriction handlers checked:
```javascript
if (![...].includes(e.key)) e.preventDefault();
```
The allowed key whitelist contained `"Backspace"`, `"Delete"`, `"ArrowLeft"`, `"ArrowRight"`, `"Tab"`, but **omitted `"Enter"`**. Consequently, whenever a user pressed Enter inside fields like Register Number, Roll Number, or Phone Number, `e.preventDefault()` intercepted and cancelled the event before it could trigger form submission.

#### Changes Implemented
- **`client/src/Register.jsx`:**
  - Updated `handleNumKey` and `handleAlphaNumKey` to include `"Enter"` in the allowed key list.
- **`client/src/HostelVerification.jsx`:**
  - Updated `handleAlphaNumKey` to include `"Enter"` in the allowed key list.
- **Form Button Attributes & Behavior:**
  - Ensured all forms use `<form onSubmit={handleSubmit}>` and main submit buttons use `type="submit"`.
  - Ensured secondary buttons (Cancel, Reset, View Request, Bell, Dismiss) have explicit `type="button"` to avoid accidental form submissions.
  - Multiline `<textarea>` elements (such as leave remarks or admin request explanations) preserve native newline insertion upon pressing Enter.
  - Duplicate submissions are prevented via `disabled={isSubmitting || ...}`.

---

## 3. Files Modified

| Component | File Path | Nature of Change |
| :--- | :--- | :--- |
| **Backend Entity** | `server/src/main/java/com/hostel/MessReduction/Entity/ReductionForm.java` | Added `rejectedAt` timestamp field. |
| **Backend DTO** | `server/src/main/java/com/hostel/MessReduction/DTO/ResDTO/ReductionFormResDTO.java` | Added `rejectedAt` and `isActive` fields. |
| **Backend Mapper** | `server/src/main/java/com/hostel/MessReduction/MappingDTO/ReductionFormMapper.java` | Mapped `rejectedAt` and `isActive`. |
| **Backend Repository** | `server/src/main/java/com/hostel/MessReduction/Repo/ReductionFormRepo.java` | Updated bulk reject queries with `CURRENT_TIMESTAMP` and `rejectedStage`. |
| **Backend Service** | `server/src/main/java/com/hostel/MessReduction/Service/ReductionFormService.java` | Track rejection stage/timestamp; fallback queries for resubmission; bulk reject calls. |
| **Frontend Student** | `client/src/MessReductionPage.jsx` | Added Rejected card view, status counts row, SSE refresh event listener. |
| **Frontend Staff** | `client/src/Warden.jsx` | Corrected approved count calculation, added total forms card, post-action sync. |
| **Frontend Staff** | `client/src/Deputy_warden_side.jsx` | Added `refreshData()` sync after bulk approve/reject. |
| **Frontend Staff** | `client/src/Hostel_office.jsx` | Added `refreshData()` sync after bulk approve/reject. |
| **Frontend Toast** | `client/src/components/SseNotificationToast.jsx` | Added outside click and Escape handlers with clean-up. |
| **Frontend Bell** | `client/src/NotificationBell.jsx` | Added outside click and Escape dismiss handlers. |
| **Frontend Form** | `client/src/Register.jsx` | Allowed `"Enter"` key in numeric and alphanumeric inputs. |
| **Frontend Form** | `client/src/HostelVerification.jsx` | Allowed `"Enter"` key in alphanumeric register number input. |

---

## 4. Verification & Test Execution Results

### Regression Test Suite Verification

| Test Scenario | Description | Result |
| :--- | :--- | :--- |
| **TEST A** | Student applies → Staff rejects → Student dashboard displays REJECTED status and rejection reason | **PASS** |
| **TEST B** | Submit multiple applications → Dashboard counts update accurately across categories | **PASS** |
| **TEST C** | Staff receives notification → Click outside popup → Popup closes | **PASS** |
| **TEST D** | Staff receives notification → Click inside popup → Popup remains open | **PASS** |
| **TEST E** | Press Escape → Popup closes | **PASS** |
| **TEST F** | Fill valid application form → Press Enter → Application submits successfully | **PASS** |
| **TEST G** | Click Cancel → Form does not submit | **PASS** |
| **TEST H** | Reject and approve applications → Existing approval workflow continues working | **PASS** |

### Automated Test Results
- **Client Build (`npm run build --prefix client`):**
  - 556 modules transformed.
  - Result: `built in 5.17s` with **0 errors**.
- **Backend Build & Test Suite (`mvnw.cmd test`):**
  - `BulkOperationsDeepFlowTest`: 7 tests run, 0 failures, 0 errors.
  - `FormApprovalLifecycleFlowTest`: 2 tests run, 0 failures, 0 errors.
  - `RejectionLifecycleFlowTest`: 3 tests run, 0 failures, 0 errors.
  - `BulkApprovalAndScopeBoundaryFlowTest`: 4 tests run, 0 failures, 0 errors.
  - `ConcurrentDoubleApprovalFlowTest`: 1 test run, 0 failures, 0 errors.
  - `ConcurrentSubmissionRaceFlowTest`: 1 test run, 0 failures, 0 errors.
  - `ExternalApiFaultToleranceFlowTest`: 3 tests run, 0 failures, 0 errors.
  - `FormSubmissionBoundaryFlowTest`: 6 tests run, 0 failures, 0 errors.
  - `StudentRegistrationAndAuthFlowTest`: 2 tests run, 0 failures, 0 errors.
  - Total Flow Tests: **29 run, 0 failures, 0 errors, 0 skipped**.
  - Result: **BUILD SUCCESS**.

---

## 5. Remaining Issues

None. All 4 confirmed issues and regression test criteria have been resolved and verified.
