# GCES Mess Reduction Portal

A comprehensive hostel mess billing management system for Government College of Engineering, Srirangam.

## Table of Contents

1. [Application Overview](#application-overview)
2. [Complete End-to-End Workflow](#complete-end-to-end-workflow)
3. [Form Submission Rules](#form-submission-rules)
4. [Architecture](#architecture)
5. [Routing Flow](#routing-flow)
6. [Authentication Flow](#authentication-flow)
7. [User Flows](#user-flows)
8. [Approval Workflow](#approval-workflow)
9. [Deputy Warden Assignment](#deputy-warden-assignment-logic)
10. [Database Entities](#database-entities)
11. [Scheduled Jobs](#scheduled-jobs)
12. [API Reference](#api-reference)
13. [Component Structure](#component-structure)
14. [Data Flow](#data-flow)
15. [Development Setup](#development-setup)
16. [End-to-End Test Flow](#end-to-end-test-flow)
17. [Troubleshooting](#troubleshooting)
18. [Tech Stack](#tech-stack)

---

## Application Overview

The Mess Reduction Portal manages hostel mess billing for students with a reduction system based on leave days. The application supports:

- **Students**: Submit mess reduction requests, view status
- **Deputy Wardens** (8): First-level approval, assigned based on student gender and year
- **Associate Warden** (1): Second-level approval, processes Deputy-approved requests
- **Office Staff**: Final processing and billing

---

## Complete End-to-End Workflow

This section describes the full lifecycle of a mess reduction request — from student registration through three-level staff approval to automatic expiry.

### High-Level Flow

```
┌─────────────┐     ┌──────────────────┐     ┌─────────────────┐     ┌──────────────┐     ┌──────────┐
│  Register   │ ──► │  Student Login   │ ──► │  Submit Form    │ ──► │  3-Level     │ ──► │ Approved │
│  (optional) │     │  (email + DOB)   │     │  (leave dates)  │     │  Approval    │     │  / Expired│
└─────────────┘     └──────────────────┘     └─────────────────┘     └──────────────┘     └──────────┘
```

### Step-by-Step Workflow

#### Phase 1 — Student Onboarding

| Step | Actor | Action | Result |
|------|-------|--------|--------|
| 1 | Student | Opens landing page (`/`) | Chooses Student or Staff path |
| 2 | Student | Registers at `/register` | Account created with name, roll/register no, DOB, department, **gender**, email, phone |
| 3 | Student | Logs in at `/student-login` with email + DOB | JWT stored in `sessionStorage`; redirected to `/student-dashboard` |

> **Gender is required at registration.** It is used to route the form to the correct Deputy Warden at submission time.

#### Phase 2 — Form Submission

| Step | Actor | Action | Result |
|------|-------|--------|--------|
| 4 | Student | Fills mess reduction form on dashboard | Enters year (1–4), room, leave date/time, arrival date/time, reason |
| 5 | System | Validates submission rules | Leave duration must be **> 3 days**; arrival date must be after leave date |
| 6 | System | Calculates `totalHolidays` | `totalHolidays = (arrivalDate − leaveDate) − 3` (3-day grace period excluded) |
| 7 | System | Assigns Deputy Warden | Based on student **gender** + form **year** → `deputyWarden1`–`deputyWarden8` |
| 8 | System | Sets status | `currentStatus = PendingDeputyWarden`; writes audit history entry |

**Submission blocked when:**
- Another form is already pending (`PendingDeputyWarden`, `PendingWarden`, or `PendingOffice`)
- An approved form is still active (arrival date ≥ today)

#### Phase 3 — Three-Level Approval Chain

```
Student submits
       │
       ▼
┌──────────────────────┐
│ PendingDeputyWarden  │  ◄── Assigned Deputy Warden reviews
└──────────┬───────────┘
           │ Approve                          │ Reject
           ▼                                  ▼
┌──────────────────────┐              ┌───────────────────────┐
│   PendingWarden      │              │ RejectedDeputyWarden  │──► Student resubmits
└──────────┬───────────┘              └───────────────────────┘
           │ Approve                          │ Reject
           ▼                                  ▼
┌──────────────────────┐              ┌───────────────────────┐
│   PendingOffice      │              │   RejectedWarden        │──► Student resubmits
└──────────┬───────────┘              └───────────────────────┘
           │ Approve                          │ Reject
           ▼                                  ▼
┌──────────────────────┐              ┌───────────────────────┐
│     Approved         │              │   RejectedOffice        │──► Student resubmits
└──────────┬───────────┘              └───────────────────────┘
           │
           ▼ (after arrival date passes)
┌──────────────────────┐
│  Soft-deleted        │  Midnight scheduler sets isActive = false
└──────────────────────┘
```

| Step | Actor | Dashboard | Sees | Action | Next Status |
|------|-------|-----------|------|--------|-------------|
| 9 | Deputy Warden | `/deputy` | Forms assigned to them in `PendingDeputyWarden` | Approve / Reject (reason required) | `PendingWarden` / `RejectedDeputyWarden` |
| 10 | Associate Warden | `/warden` | All forms in `PendingWarden` | Approve / Reject | `PendingOffice` / `RejectedWarden` |
| 11 | Office Staff | `/office` | All forms in `PendingOffice` | Approve / Reject | `Approved` / `RejectedOffice` |

Each approve/reject action:
- Updates `currentStatus` on the form
- Appends a `ReductionFormHistory` record (who, when, from/to status, comment)
- Creates an `ActivityLog` entry for the staff member

Staff can also **bulk approve** all pending forms in their queue via the bulk endpoint.

#### Phase 4 — Rejection & Resubmission

| Step | Actor | Action | Result |
|------|-------|--------|--------|
| 12 | Staff | Rejects with reason | Status becomes `RejectedDeputyWarden`, `RejectedWarden`, or `RejectedOffice` |
| 13 | Student | Opens rejected form on dashboard | Can edit and resubmit via `POST .../resubmit` |
| 14 | System | Re-validates dates, re-assigns deputy | Status reset to `PendingDeputyWarden`; approval chain restarts |

Only **rejected** forms can be edited. Pending and approved forms are locked.

#### Phase 5 — Post-Approval & Expiry

| Step | When | What Happens |
|------|------|--------------|
| 15 | Form is `Approved` and arrival date ≥ today | Student cannot submit a new form; approved form visible on student dashboard |
| 16 | Current date > arrival date | Approved forms hidden from staff queues |
| 17 | Daily at midnight | `ReductionFormExpiryScheduler` soft-deletes expired forms (`isActive = false`) and deactivates linked history |
| 18 | Daily at midnight | `ActivityLogExpiryScheduler` soft-deletes activity logs past their arrival date |

Expired records are not physically deleted — they are filtered out of active queries via the `isActive` flag.

### Role Summary

| Role | Login | Storage | Dashboard Route | Primary Responsibility |
|------|-------|---------|-----------------|------------------------|
| Student | Email + DOB | `sessionStorage` | `/student-dashboard` | Submit, view, resubmit forms |
| Deputy Warden | Username + password + role | Cookies (7 days) | `/deputy` | First approval — only assigned forms |
| Associate Warden | Username + password + role | Cookies (7 days) | `/warden` | Second approval — all deputy-approved forms |
| Office | Username + password + role | Cookies (7 days) | `/office` | Final approval and billing processing |

### Default Staff Credentials

Seeded automatically on every backend startup by `StaffDataInitializer`:

| Username | Password | Role |
|----------|----------|------|
| `warden` | `warden123` | Warden |
| `deputyWarden1`–`deputyWarden8` | `deputy123` | DeputyWarden |
| `office` | `office123` | Office |

---

## Form Submission Rules

| Rule | Detail |
|------|--------|
| Minimum leave duration | Leave period must be **more than 3 days** (`arrivalDate − leaveDate > 3`) |
| Holiday calculation | `totalHolidays = days between leave and arrival − 3` |
| Date order | `arrivalDate` must be strictly after `leaveDate` |
| One pending at a time | Cannot submit while any form is `PendingDeputyWarden`, `PendingWarden`, or `PendingOffice` |
| Active approved block | Cannot submit if an `Approved` form exists with `arrivalDate ≥ today` |
| Edit lock | Pending and approved forms cannot be edited; only rejected forms can be resubmitted |
| Deputy assignment | Resolved from student gender (registration) + form year (submission) via `StaffUsers` lookup |

---

## Architecture

### Frontend Structure

```
client/src/
├── App.jsx                 # Root router - controls all navigation
├── ProtectedRoute.jsx      # Auth validation wrapper (uses authService)
├── api/apiClient.js        # Axios HTTP client
├── utils/cookieUtils.js    # Cookie management
├── services/
│   └── authService.js      # Centralized auth logic (NEW)
│
# Pages
├── LandingPage.jsx         # Entry point - student/staff selection
├── StudentLogin.jsx        # Student authentication
├── StaffLogin.jsx          # Staff authentication (uses authService)
├── Register.jsx            # Student registration
├── MessReductionPage.jsx   # Student dashboard
├── Warden.jsx              # Associate Warden dashboard
├── Deputy_warden_side.jsx  # Deputy warden dashboard
└── Hostel_office.jsx       # Office dashboard
```

### Backend Structure

```
server/src/main/java/
├── Controller/             # REST API endpoints
│   ├── AuthController.java
│   ├── StaffAuthController.java
│   └── StudentFormController.java
├── Service/                # Business logic
├── Entity/                 # JPA entities
├── Repository/             # Data access layer
└── security/               # JWT & Spring Security config
```

---

## Routing Flow

### Root Router (App.jsx)

All routing is centralized in `App.jsx`. The app uses a custom router (not React Router) with state-based navigation.

```javascript
// Route configuration in App.jsx
const ROUTE_CONFIG = {
  // Public routes
  '/':                     { screen: 'landing', protected: false },
  '/student-login':       { screen: 'student-login', protected: false },
  '/staff-login':         { screen: 'staff-login', protected: false },
  '/register':            { screen: 'register', protected: false },

  // Protected student routes
  '/student-dashboard':   { screen: 'student-dashboard', protected: true, type: 'student' },

  // Protected staff routes
  '/deputy':              { screen: 'deputy', protected: true, type: 'staff', role: 'DeputyWarden' },
  '/warden':              { screen: 'warden', protected: true, type: 'staff', role: 'Warden' },
  '/office':              { screen: 'office', protected: true, type: 'staff', role: 'Office' },
};
```

### Navigation Flow

1. **Initial Load**
   ```
   Browser URL: /deputy
   App.jsx reads URL
   → Determines route config
   → Checks if protected
   → Renders ProtectedRoute → Deputy_warden_side
   ```

2. **Login Redirect**
   ```
   StaffLogin submits credentials
   → Backend returns token + role + username
   → StaffLogin sets cookies (staffToken, staffUsername, staffRole)
   → StaffLogin calls onNavigate based on role:
     - DeputyWarden → /deputy
     - Warden → /warden
     - Office → /office
   → App.jsx updates state
   → URL updates to route
   → ProtectedRoute validates auth
   → Dashboard renders
   ```

3. **Navigation Between Pages**
   ```
   LandingPage button click
   → Calls onNavigate('/student-login')
   → App.jsx updates currentPath state
   → Re-renders with StudentLogin
   ```

---

## Authentication Flow

### Student Authentication

**Storage**: `sessionStorage`
- `token`: JWT token
- `currentUser`: User info (name, studentId, email)

**Flow**:
```
1. StudentLogin form submit
2. POST /api/auth/login (email, dob)
3. Response: { token, name, studentId }
4. Store in sessionStorage
5. Navigate to /student-dashboard
6. ProtectedRoute checks sessionStorage.token
7. Render MessReductionPage
```

### Staff Authentication

**Storage**: Cookies (7-day expiry)
- `staffToken`: JWT token
- `staffUsername`: Staff username
- `staffRole`: Warden / DeputyWarden / Office

**Flow**:
```
1. StaffLogin form submit
2. POST /api/staff/login (username, password, role)
3. Response: { token, username, role }
4. Set cookies via setCookie()
5. Determine route based on role:
   - DeputyWarden → /deputy
   - Warden → /warden
   - Office → /office
6. Navigate to determined route
7. ProtectedRoute validates via authService.validateStaff():
   a. Call GET /api/staff/validate (PROTECTED endpoint)
   b. JwtFilter validates JWT and populates SecurityContextHolder
   c. Controller reads authenticated user from SecurityContext
   d. Returns {valid: true, username, role}
   e. Verify role matches route
8. Render dashboard or redirect
```

### ProtectedRoute Validation Steps (Using authService)

```javascript
// Step 1: Validate using authService
IF route.type === 'student':
  authService.getStudentAuth() - check token exists

IF route.type === 'staff':
  authService.validateStaff() - dedicated auth endpoint

// Step 2: Verify access rights
IF valid:
  Check role matches route.requiredRole

IF invalid:
  authService.clearStaffAuth()
  Redirect to /staff-login

// Step 3: Render or redirect
IF all checks pass:
  Render children (dashboard component)
```

---

## User Flows

### Student Flow

```
[Landing Page]
    ↓
[Student Login] ←── [Register] (if new user — gender required)
    ↓ (successful login)
[Student Dashboard]
    ├── View existing applications and statuses
    ├── Submit new mess reduction request
    │   ├── Enter year, room, leave/arrival dates & times
    │   ├── Enter reason
    │   └── Submit (blocked if pending or active approved form exists)
    ├── Resubmit rejected forms (RejectedDeputyWarden / RejectedWarden / RejectedOffice)
    └── Logout
```

### Deputy Warden Flow

```
[Landing Page]
    ↓
[Staff Login]
    ↓ (role=DeputyWarden)
[Deputy Dashboard]
    ├── View ONLY requests assigned to them (based on student gender + year)
    ├── Process pending approvals
    ├── Approve → moves to Warden
    ├── Reject → marks as RejectedDeputyWarden
    └── Logout
```

### Associate Warden Flow

```
[Landing Page]
    ↓
[Staff Login]
    ↓ (role=Warden)
[Warden Dashboard]
    ├── View ONLY requests approved by assigned Deputy Warden
    ├── Review pending approvals
    ├── Approve → moves to Office
    ├── Reject → marks as RejectedWarden
    └── Logout
```

### Office Flow

```
[Landing Page]
    ↓
[Staff Login]
    ↓ (role=Office)
[Office Dashboard]
    ├── View ONLY requests approved by Warden
    ├── Final processing
    ├── Approve → marks as Approved
    ├── Reject → marks as RejectedOffice
    └── Logout
```

---

## Approval Workflow

### New Approval Hierarchy

```
Student
    ↓
Assigned Deputy Warden (based on gender + year)
    ↓
Associate Warden (single warden)
    ↓
Office (final decision)
```

### Status Flow

| Step | From Status | To Status | Action By |
|------|------------|-----------|-----------|
| 1 | — | `PendingDeputyWarden` | Student submits |
| 2 | `PendingDeputyWarden` | `PendingWarden` | Assigned Deputy Warden approves |
| 3 | `PendingDeputyWarden` | `RejectedDeputyWarden` | Assigned Deputy Warden rejects |
| 4 | `PendingWarden` | `PendingOffice` | Associate Warden approves |
| 5 | `PendingWarden` | `RejectedWarden` | Associate Warden rejects |
| 6 | `PendingOffice` | `Approved` | Office approves |
| 7 | `PendingOffice` | `RejectedOffice` | Office rejects |
| 8 | `RejectedDeputyWarden` / `RejectedWarden` / `RejectedOffice` | `PendingDeputyWarden` | Student resubmits |

---

## Deputy Warden Assignment Logic

### Assignment Rules

When a student submits a mess reduction request, the system automatically assigns a Deputy Warden based on the student's **gender** and **year**.

### Deputy Warden Mapping

| Deputy Warden | Gender | Year |
|---------------|--------|------|
| deputyWarden1 | MALE | 1st |
| deputyWarden2 | MALE | 2nd |
| deputyWarden3 | MALE | 3rd |
| deputyWarden4 | MALE | 4th |
| deputyWarden5 | FEMALE | 1st |
| deputyWarden6 | FEMALE | 2nd |
| deputyWarden7 | FEMALE | 3rd |
| deputyWarden8 | FEMALE | 4th |

### Assignment Logic

At submission time, the backend looks up the Deputy Warden from the `StaffUsers` table by role, gender, and year:

```java
// ReductionFormService.resolveAssignedDeputyWarden()
staffUsersRepo.findByRoleAndGenderAndYear(Role.DeputyWarden, studentGender, formYear)
    → username stored in ReductionForm.assignedDeputyWarden
```

The static mapping in `DeputyWardenAssignment.java` mirrors this table but the DB lookup is authoritative.

### Database Field

The `ReductionForm` entity stores the assigned Deputy Warden:

```java
@Entity
public class ReductionForm {
    // ... other fields
    
    @Column(name = "assigned_deputy_warden")
    private String assignedDeputyWarden;
    
    // ... getters/setters
}
```

---

## Visibility Rules and Access Control

### Deputy Warden Visibility

- **Can view**: ONLY requests where `assignedDeputyWarden` equals their username
- **Cannot view**: Requests assigned to other Deputy Wardens

**Example:**
```
deputyWarden3 logs in
→ Can view: requests with assignedDeputyWarden = "deputyWarden3"
→ Cannot view: requests with assignedDeputyWarden = "deputyWarden1", "deputyWarden2", etc.
```

### Associate Warden Visibility

- **Can view**: ONLY requests with status `PendingWarden` (approved by Deputy Warden)
- **Cannot view**: Requests with status `PendingDeputyWarden` (not yet approved by Deputy)

### Office Visibility

- **Can view**: ONLY requests with status `PendingOffice` (approved by Warden)
- **Cannot view**: Requests with status `PendingWarden` or `PendingDeputyWarden`

### Backend Filtering

All filtering is done on the backend. Frontend simply displays the data returned by the API.

| Role | Backend Endpoint | Filter Logic |
|------|------------------|--------------|
| Deputy Warden | `/api/hostelStaff/staff/deputyWarden` | `WHERE assignedDeputyWarden = :username AND currentStatus = 'PendingDeputyWarden'` |
| Associate Warden | `/api/hostelStaff/staff/warden` | `WHERE currentStatus = 'PendingWarden'` |
| Office | `/api/hostelStaff/staff/office` | `WHERE currentStatus = 'PendingOffice'` |

---

## Staff Initialization

Staff accounts are **auto-seeded on every backend startup** by `StaffDataInitializer`. Existing staff rows are deleted and recreated to ensure consistent roles and credentials.

| Username | Password | Role | Gender | Year |
|----------|----------|------|--------|------|
| `warden` | `warden123` | Warden | — | — |
| `deputyWarden1` | `deputy123` | DeputyWarden | MALE | 1 |
| `deputyWarden2` | `deputy123` | DeputyWarden | MALE | 2 |
| `deputyWarden3` | `deputy123` | DeputyWarden | MALE | 3 |
| `deputyWarden4` | `deputy123` | DeputyWarden | MALE | 4 |
| `deputyWarden5` | `deputy123` | DeputyWarden | FEMALE | 1 |
| `deputyWarden6` | `deputy123` | DeputyWarden | FEMALE | 2 |
| `deputyWarden7` | `deputy123` | DeputyWarden | FEMALE | 3 |
| `deputyWarden8` | `deputy123` | DeputyWarden | FEMALE | 4 |
| `office` | `office123` | Office | — | — |

> **Note:** Do not rely on manually inserted SQL for staff accounts — the initializer overwrites them on each restart.

---

## Database Entities

```
StudentDetails (1) ──────< (N) ReductionForm (1) ──────< (N) ReductionFormHistory
     │                           │
     │ gender                    │ assignedDeputyWarden (username)
     │ department                │ currentStatus, dates, totalHolidays
     │ dob, email, etc.          │ isActive (soft delete flag)
     │
StaffUsers (standalone)           ActivityLog (standalone audit trail)
     role, gender, year            isActive
```

| Entity | Key Fields | Relationships |
|--------|------------|---------------|
| **StudentDetails** | `studentId`, `name`, `registerNo`, `rollNo`, `department`, `gender`, `dob`, `emailId`, `phoneNo` | One-to-many → `ReductionForm` |
| **ReductionForm** | `formId`, `year`, `roomNo`, leave/arrival dates & times, `reason`, `totalHolidays`, `currentStatus`, `assignedDeputyWarden`, `rejectReason`, `isActive` | Many-to-one → `StudentDetails`; one-to-many → `ReductionFormHistory` |
| **ReductionFormHistory** | `fromStatus`, `toStatus`, `eventType`, `performedBy`, `comment`, `eventTimestamp`, `isActive` | Many-to-one → `ReductionForm` |
| **StaffUsers** | `userId`, `userName`, `password` (BCrypt), `role`, `gmail`, `gender`, `year` | Used for deputy lookup and staff auth |
| **ActivityLog** | `formId`, `studentId`, `studentName`, `department`, `staffRole`, `staffName`, `action`, `timestamp`, `arrivalDate`, `isActive` | Denormalized staff action audit |

### Enums

- **FormStatus**: `PendingDeputyWarden`, `PendingWarden`, `PendingOffice`, `Approved`, `RejectedDeputyWarden`, `RejectedWarden`, `RejectedOffice`
- **Department**: `MECH`, `CIVIL`, `ECE`, `EEE`, `CSE`, `MECHATRONICS`
- **Gender**: `MALE`, `FEMALE`
- **Role**: `Warden`, `DeputyWarden`, `Office`

---

## Scheduled Jobs

Both schedulers run daily at **midnight** (`cron = "0 0 0 * * ?"`), enabled via `@EnableScheduling`.

| Scheduler | Method | Behavior |
|-----------|--------|----------|
| `ReductionFormExpiryScheduler` | `expireReductionForms()` | Finds active forms where `arrivalDate < today`; sets `form.isActive = false` and deactivates linked history records |
| `ActivityLogExpiryScheduler` | `expireLogs()` | Finds active logs where `arrivalDate < today`; sets `log.isActive = false` |

---

## Component Structure

### App.jsx (Root Controller)

```javascript
function App() {
  // Current route state drives entire app
  const [currentPath, setCurrentPath] = useState(window.location.pathname);
  
  // Navigation function - single source of truth
  const navigate = (path) => {
    window.history.pushState({}, '', path);
    setCurrentPath(path);
  };
  
  // Render based on route config
  const renderScreen = () => {
    switch(route.screen) {
      case 'landing': return <LandingPage onNavigate={navigate} />;
      case 'deputy': return (
        <ProtectedRoute requiredType="staff" requiredRole="DeputyWarden" onNavigate={navigate}>
          <Deputy_warden_side onNavigate={navigate} />
        </ProtectedRoute>
      );
      // ... other routes
    }
  };
}
```

### ProtectedRoute.jsx (Auth Guard)

```javascript
function ProtectedRoute({ 
  children, 
  requiredType,      // 'student' | 'staff'
  requiredRole,      // 'Warden' | 'DeputyWarden' | 'Office'
  requiredUsername,  // for warden routes
  onNavigate 
}) {
  const [authState, setAuthState] = useState('loading');
  
  useEffect(() => {
    validateAuth(); // Steps documented above
  }, []);
  
  if (authState === 'loading') return <LoadingSpinner />;
  if (authState === 'authenticated') return children;
}
```

### Page Components

All page components follow this pattern:

```javascript
function PageName({ onNavigate }) {
  // Local state
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  
  // Handlers
  const handleAction = () => {
    // API call
    // Update state
    // Navigate if needed: onNavigate('/path')
  };
  
  // Render UI
  return (...);
}
```

---

## API Reference

### API Client Configuration (api/apiClient.js)

```javascript
const apiClient = axios.create({
  baseURL: 'http://localhost:8083',
  headers: { 'Content-Type': 'application/json' }
});
```

### Public Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/auth/login` | POST | Student login (email + DOB) |
| `/api/student/reg` | POST | Student registration |
| `/api/staff/login` | POST | Staff login (username + password + role) |

### Student Endpoints (JWT required)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/student-form/Student/{studentId}` | GET | Student profile with forms |
| `/api/student-form/StudentForm/{studentId}` | POST | Submit new form |
| `/api/student-form/StudentForm/{studentId}` | GET | List student's forms |
| `/api/student-form/StudentForm/{studentId}/{formId}` | GET | Get form for edit (rejected only) |
| `/api/student-form/StudentForm/{studentId}/{formId}/resubmit` | POST | Resubmit rejected form |
| `/api/student-form/StudentForm/{studentId}/{formId}/history` | GET | Form audit trail |

### Deputy Warden Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/hostelStaff/staff/deputyWarden` | GET | Pending forms assigned to logged-in deputy |
| `/api/hostelStaff/staff/deputyWarden/{formId}?action=Approve` | PATCH | Approve form |
| `/api/hostelStaff/staff/deputyWarden/{formId}/reject` | PATCH | Reject form `{ rejectReason }` |
| `/api/hostelStaff/staff/deputyWarden/bulk?action=Approve` | PATCH | Bulk approve |
| `/api/hostelStaff/staff/deputyWarden/year-count` | GET | Year-wise pending count |

### Warden Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/hostelStaff/staff/warden?gender=&year=` | GET | Pending warden-stage forms |
| `/api/hostelStaff/staff/warden/{formId}?action=Approve` | PATCH | Approve form |
| `/api/hostelStaff/staff/warden/{formId}/reject` | PATCH | Reject form |
| `/api/hostelStaff/staff/warden/bulk?action=Approve` | PATCH | Bulk approve |
| `/api/hostelStaff/staff/dashboard-count/warden` | GET | Warden dashboard counts |

### Office Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/hostelStaff/staff/office?gender=&year=` | GET | Pending office-stage forms |
| `/api/hostelStaff/staff/office/{formId}?action=Approve` | PATCH | Final approve |
| `/api/hostelStaff/staff/office/{formId}/reject` | PATCH | Reject form |
| `/api/hostelStaff/staff/office/bulk?action=Approve` | PATCH | Bulk approve |
| `/api/hostelStaff/staff/office/year-count` | GET | Year-wise pending counts |
| `/api/hostelStaff/staff/forms/delete-all` | DELETE | Delete all forms (Office only, API only) |

### Shared Staff Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/staff/validate` | GET | Validate staff JWT (protected) |
| `/api/hostelStaff/staff/dashboard-count` | GET | Global or deputy-scoped dashboard counts |
| `/api/logs/my-logs` | GET | Staff activity history |
| `/api/logs` | POST | Create activity log (also auto-created on approve/reject) |

---

## Data Flow

### Student Form Submission

```
[MessReductionPage]
    ↓ POST /api/student-form/StudentForm
[Backend Controller]
    ↓
[Service Layer]
    ↓
[Repository]
    ↓
[Database]
    ↓
[Response: form data]
    ↓
[MessReductionPage updates state]
    ↓
[UI re-renders with new data]
```

### Staff Request Processing

```
[Warden/Deputy/Office Dashboard]
    ↓ GET /api/hostelStaff/staff/dashboard-count (business data)
[Backend returns pending requests]
    ↓
[Dashboard displays requests]
    ↓ Staff clicks approve/reject
[POST /api/hostelStaff/staff/final-approve]
    ↓
[Backend updates status]
    ↓
[Dashboard refreshes data]
```

### Authentication State Sync (Corrected JWT Architecture)

```
[StaffLogin]
    ↓ POST /api/staff/login
[Backend returns token + username + role]
    ↓
[authService.setStaffAuth() - stores cookies]
    ↓
[onNavigate(dashboardRoute)]
    ↓
[ProtectedRoute mounts]
    ↓
[authService.validateStaff()]
    ↓ GET /api/staff/validate (PROTECTED endpoint)
[Request includes Authorization: Bearer <token>]
    ↓
[JwtFilter validates JWT]
[SecurityContextHolder populated with Authentication]
    ↓
[Controller reads user from SecurityContext]
[Returns {valid: true, username, role}]
    ↓
[ProtectedRoute verifies role/username match]
    ↓
[Dashboard renders - then fetches its own data]
    ↓
[Dashboard business API calls]
```

**Key Architecture Points:**
- `/api/staff/validate` is now a **protected endpoint** (not permitAll)
- `JwtFilter` validates the JWT and populates `SecurityContextHolder`
- Controller reads authenticated user from `SecurityContext` (not manual header parsing)
- This follows correct Spring Security JWT patterns

---

## Auth Service Layer (NEW)

The `authService.js` provides a clean separation between auth logic and UI components.

### Auth Service API

```javascript
// Staff auth
authService.validateStaff()        // Validates via /api/staff/validate
authService.setStaffAuth(token, username, role)  // Stores cookies
authService.clearStaffAuth()       // Removes all staff cookies
authService.getStaffAuth()         // Returns {token, username, role}
authService.getStaffDashboardRoute(role, username)  // Returns correct route

// Student auth
authService.getStudentAuth()       // Returns {token, user}
authService.setStudentAuth(token, userData)
authService.clearStudentAuth()
```

### Why authService?

- **Separation of Concerns**: Auth logic in one place, not scattered across components
- **Testability**: Auth logic can be tested independently
- **Maintainability**: Changes to auth flow only need updates in one file
- **Clean ProtectedRoute**: Only uses authService, no direct API calls

---

## Cookie Management

### Cookie Utilities (utils/cookieUtils.js)

```javascript
// Set cookie with expiry (days)
setCookie(name, value, days)

// Get cookie value
getCookie(name)

// Delete cookie
deleteCookie(name)
```

### Cookie Names

| Cookie | Purpose | Set By | Read By |
|--------|---------|--------|---------|
| staffToken | JWT auth token | StaffLogin | ProtectedRoute, apiClient |
| staffUsername | Staff identifier | StaffLogin | ProtectedRoute |
| staffRole | Role for access control | StaffLogin | ProtectedRoute |

---

## Security Architecture

### JWT Authentication Flow (Corrected Implementation)

The authentication system follows proper Spring Security JWT patterns:

```
┌─────────────────────────────────────────────────────────────────┐
│  LOGIN FLOW                                                      │
│  ─────────                                                       │
│  1. StaffLogin → POST /api/staff/login                           │
│  2. StaffAuthService.authenticate()                              │
│  3. StaffJwtUtil.generateToken() → Returns JWT                   │
│  4. Frontend stores token in cookies                             │
│  5. Navigate to protected route                                  │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│  VALIDATION FLOW (Protected Endpoint)                              │
│  ─────────────────────                                            │
│  1. ProtectedRoute → validateStaff()                             │
│  2. apiClient.get('/api/staff/validate')                       │
│     ├── Request interceptor adds Authorization: Bearer <token> │
│     └── Cookie read for token                                  │
│  3. JwtFilter.doFilterInternal()                               │
│     ├── Extracts JWT from Authorization header                 │
│     ├── Validates token with StaffJwtUtil                        │
│     ├── Loads user details via StaffUserDetailsService         │
│     └── Populates SecurityContextHolder                        │
│  4. StaffAuthController.validateToken()                        │
│     ├── Reads Authentication from SecurityContextHolder          │
│     ├── Extracts username and role from principal                │
│     └── Returns {valid: true, username, role}                    │
│  5. ProtectedRoute verifies role matches route requirements      │
│  6. Dashboard renders                                            │
└─────────────────────────────────────────────────────────────────┘
```

### Key Security Fixes Applied

**Previous Architecture (Incorrect)**:
- `/api/staff/validate` was `permitAll()` - unauthenticated access
- `JwtFilter.shouldNotFilter()` skipped validate endpoint
- Controller manually parsed JWT from header
- No SecurityContextHolder population
- Result: Empty SecurityContext, 401 responses, redirect loops

**Corrected Architecture**:
- `/api/staff/validate` requires authentication
- `JwtFilter` processes ALL protected endpoints including validate
- JwtFilter validates JWT and populates SecurityContextHolder
- Controller reads authenticated user from SecurityContext
- Result: Proper JWT validation flow, no redirect loops

### Security Components

| Component | Responsibility |
|-----------|---------------|
| `JwtFilter` | Validates JWT from Authorization header, populates SecurityContextHolder |
| `StaffJwtUtil` | JWT token generation, validation, and extraction |
| `StaffUserDetailsService` | Loads user details for JWT validation |
| `SecurityConfig` | Defines permitAll vs authenticated endpoints |
| `StaffAuthController.validateToken()` | Returns authenticated user info from SecurityContext |

### Security Considerations

1. **JWT Token Storage**: 
   - Students: sessionStorage (cleared on tab close)
   - Staff: Cookies with 7-day expiry

2. **Route Protection**:
   - All staff routes protected by ProtectedRoute
   - Role-based access control
   - Warden username-to-year mapping

3. **API Security**:
   - Authorization header with Bearer token
   - 401 handling clears auth and redirects

4. **CORS**: 
   - Backend configured for localhost:5173
   - Credentials included for cookies

---

## Development Setup

### Frontend

```bash
cd client
npm install
npm run dev
```

### Backend

```bash
cd server
./mvnw spring-boot:run
```

### Default Ports

- Frontend: http://localhost:5173
- Backend: http://localhost:8083

---

## End-to-End Test Flow

Use this checklist to verify the full workflow locally:

1. **Start backend** — `cd server && ./mvnw spring-boot:run` (port 8083)
2. **Start frontend** — `cd client && npm install && npm run dev` (port 5173)
3. **Register** — Go to `/register`, fill all fields including **gender**
4. **Student login** — `/student-login` with email + DOB
5. **Submit form** — On dashboard, submit with leave period > 3 days (e.g. leave June 1, arrival June 10 → 7 holidays)
6. **Deputy approve** — Login at `/staff-login` as the assigned deputy (e.g. MALE year 3 → `deputyWarden3` / `deputy123`) → approve at `/deputy`
7. **Warden approve** — Login as `warden` / `warden123` → approve at `/warden`
8. **Office approve** — Login as `office` / `office123` → final approve at `/office`
9. **Verify** — Student dashboard shows `Approved` status
10. **Rejection test** — Reject at any stage, confirm student can resubmit and chain restarts at `PendingDeputyWarden`

---

## Build & Deploy

### Frontend Build

```bash
cd client
npm run build
```

Output: `dist/` folder with static files

### Backend Build

```bash
cd server
./mvnw clean package
```

Output: `target/*.jar`

---

## Troubleshooting

### Login redirect issues
- Check that `/api/staff/validate` endpoint returns 401 without token, 200 with valid token
- Verify cookies are being set correctly after login
- Check browser dev tools Network tab for validate call - ensure `Authorization: Bearer <token>` header is present
- Look at console logs with `[API Request]`, `[validateStaff]`, `[ProtectedRoute]` prefixes

### 401 Unauthorized on /api/staff/validate
- **Most common cause**: Token not being sent in Authorization header
- Check request interceptor logs: `[API Request] Token found: YES/NO`
- Verify cookie is set before validate request: `[validateStaff] Token from cookie: YES/NO`
- Ensure backend `JwtFilter` is not skipping `/api/staff/validate` (check `shouldNotFilter()`)
- Verify `SecurityConfig` does NOT have `.requestMatchers("/api/staff/validate").permitAll()`

### Role mismatch redirect (wrong dashboard)
- Check console: `[ProtectedRoute] Role check: result.role='X' vs requiredRole='Y'`
- Ensure user logs in with role matching their assigned route
- Backend returns enum value (e.g., `DeputyWarden`), frontend compares to string

### Token present but validate fails
- Check if token is expired: decode JWT at jwt.io to check `exp` claim
- Verify `jwt.secret` in backend matches between login and validation
- Ensure `StaffJwtUtil` and `JwtFilter` use same signing key

### Redirect loop after login
- Check if both interceptor AND validateStaff clear cookies on 401
- Look for `[API Response] 401` followed by `[validateStaff] 401 received`
- This should not happen with corrected architecture - both should handle 401 gracefully

### Debug Logging
Debug console logs have been added to trace the auth flow:
- `[StaffLogin]` - Login success and navigation
- `[API Request]` - Token retrieval and header setting
- `[API Response]` - Response status and 401 handling
- `[validateStaff]` - Token from cookie and validation results
- `[ProtectedRoute]` - Auth state transitions and role comparisons

Open browser DevTools Console and filter by these prefixes to trace issues.

---

## Tech Stack

### Frontend
- React 19.2.0
- Vite 7.3.1
- Tailwind CSS 4.1.18
- Framer Motion (animations)
- Axios (HTTP client)

### Backend
- Spring Boot
- Spring Security (JWT)
- JPA/Hibernate
- MySQL/PostgreSQL (configurable)

---

*Government College of Engineering, Srirangam - Mess Reduction Portal v1.0*
