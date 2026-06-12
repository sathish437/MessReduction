<<<<<<< HEAD
# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) (or [oxc](https://oxc.rs) when used in [rolldown-vite](https://vite.dev/guide/rolldown)) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.
=======
# GCES Mess Reduction Portal

A comprehensive hostel mess billing management system for Government College of Engineering, Srirangam.

## Table of Contents

1. [Application Overview](#application-overview)
2. [Architecture](#architecture)
3. [Routing Flow](#routing-flow)
4. [Authentication Flow](#authentication-flow)
5. [User Flows](#user-flows)
6. [Component Structure](#component-structure)
7. [API Integration](#api-integration)
8. [Data Flow](#data-flow)

---

## Application Overview

The Mess Reduction Portal manages hostel mess billing for students with a reduction system based on leave days. The application supports:

- **Students**: Submit mess reduction requests, view status
- **Wardens**: Approve/reject 1st-level requests
- **Deputy Wardens**: Process 2nd-level approvals
- **Office Staff**: Final processing and billing

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
├── Warden.jsx              # Warden dashboard
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
  '/':                    { screen: 'landing', protected: false },
  '/student-login':       { screen: 'student-login', protected: false },
  '/staff-login':         { screen: 'staff-login', protected: false },
  '/register':            { screen: 'register', protected: false },
  
  // Protected student routes
  '/student-dashboard':   { screen: 'student-dashboard', protected: true, type: 'student' },
  
  // Protected staff routes
  '/deputy':              { screen: 'deputy', protected: true, type: 'staff', role: 'DeputyWarden' },
  '/warden/1st':          { screen: 'warden', protected: true, type: 'staff', role: 'Warden', username: 'warden1' },
  '/warden/2nd':          { screen: 'warden', protected: true, type: 'staff', role: 'Warden', username: 'warden2' },
  '/warden/3rd':          { screen: 'warden', protected: true, type: 'staff', role: 'Warden', username: 'warden3' },
  '/warden/4th':          { screen: 'warden', protected: true, type: 'staff', role: 'Warden', username: 'warden4' },
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
   → StaffLogin calls onNavigate('/deputy')
   → App.jsx updates state
   → URL updates to /deputy
   → ProtectedRoute validates auth
   → Deputy_warden_side renders
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
5. Determine route based on role+username:
   - Warden + warden1 → /warden/1st
   - DeputyWarden → /deputy
   - Office → /office
6. Navigate to determined route
7. ProtectedRoute validates via authService.validateStaff():
   a. Call GET /api/staff/validate (PROTECTED endpoint)
   b. JwtFilter validates JWT and populates SecurityContextHolder
   c. Controller reads authenticated user from SecurityContext
   d. Returns {valid: true, username, role}
   e. Verify role matches route
   f. For wardens, verify username matches year
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
  Check username matches (for wardens)
  
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
[Student Login] ←── [Register] (if new user)
    ↓ (successful login)
[Student Dashboard]
    ├── View existing applications
    ├── Submit new mess reduction request
    │   ├── Enter leave dates
    │   ├── Enter reason
    │   └── Submit form
    └── Logout
```

### Warden Flow

```
[Landing Page]
    ↓
[Staff Login]
    ↓ (role=Warden)
[Warden Dashboard]
    ├── View year-specific requests (1st/2nd/3rd/4th)
    ├── Review pending approvals
    ├── Accept/Reject requests
    └── Logout
```

### Deputy Warden Flow

```
[Landing Page]
    ↓
[Staff Login]
    ↓ (role=DeputyWarden)
[Deputy Dashboard]
    ├── View all year requests
    ├── Process pending approvals
    ├── Bulk approve/reject
    └── Logout
```

### Office Flow

```
[Landing Page]
    ↓
[Staff Login]
    ↓ (role=Office)
[Office Dashboard]
    ├── View pending final processing
    ├── Mark as paid/rejected
    ├── View archive
    └── Logout
```

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

## API Integration

### API Client Configuration (api/apiClient.js)

```javascript
const apiClient = axios.create({
  baseURL: 'http://localhost:2020',
  headers: { 'Content-Type': 'application/json' }
});

// Request interceptor - add auth token
apiClient.interceptors.request.use((config) => {
  const token = getCookie('staffToken') || sessionStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor - handle 401
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Clear auth and redirect
    }
    return Promise.reject(error);
  }
);
```

### Key API Endpoints

| Endpoint | Method | Description | Auth |
|----------|--------|-------------|------|
| /api/auth/login | POST | Student login | Public |
| /api/staff/login | POST | Staff login | Public |
| /api/staff/validate | GET | Validate staff token | Authenticated |
| /api/student/reg | POST | Student registration | Public |
| /api/student-form/StudentForm | GET | Get student forms | Student |
| /api/student-form/StudentForm | POST | Submit new form | Student |
| /api/hostelStaff/staff/dashboard-count | GET | Dashboard data | Staff |
| /api/hostelStaff/staff/final-approve | POST | Final approval | Office |

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
- Backend: http://localhost:2020

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
>>>>>>> 808cf3b0b1fc91fef00810479c2e1416be873747
