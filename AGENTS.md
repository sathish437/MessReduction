# AGENTS.md

Repo guidance for AI coding agents. Verified against the codebase (2026-08).

## Overview

Monorepo: `client` (React 19 / Vite 7 / Tailwind 4) + `server` (Spring Boot 4.0.2 / Maven / Java 21). The built frontend is baked into the Spring Boot jar via a multi-stage `Dockerfile` (`client/dist` → `server/src/main/resources/static`).

## Commands

```sh
# Backend
cd server
mvn spring-boot:run            # dev run
mvn test                       # tests
mvn clean package              # full build (includes client? no — build client first)

# Frontend
cd client
npm install
npm run dev                    # Vite dev server
npm run build                  # prod build (must run before backend package)
npm run preview
```

- `client/package.json` has a broken mock script: `"server": "json-server ../db.json --port 5000"` references a `db.json` that does not exist. Do not rely on it.

## Environment Variables

Backend (Render-style, read by `application.properties` / Spring):

- `PORT` — HTTP port override
- `SPRING_DATABASE_URL`, `SPRING_DATABASE_USERNAME`, `SPRING_DATABASE_PASSWORD` — PostgreSQL
- `JWT_SECRET`, `JWT_EXPIRATION`

Frontend (`client/.env`):

- `VITE_API_BASE_URL` — API base URL; empty string means same-origin
- `VITE_ENABLE_HOSTEL_VERIFICATION` — if set and non-empty, used directly; else falls back to `GET /api/auth/hostel-verification-status`

## Architecture

Backend package layout (capitalized singular subpackages under `com.hostel.MessReduction`):

```
Controller\   10 controllers
Service\      ~16 services incl. 4 *Scheduler classes
Repo\         14 repositories (complete list below)
Entity\
Config\       CorsConfig.java (defines corsConfigurationSource bean)
DTO\          ReqDTO\ + ResDTO\ subpackages
security\     SecurityConfig, JwtFilter, JwtAuthEntryPoint, CustomUserDetailsService, StaffUserDetailsService
utils\        TelegramNotificationService
MappingDTO\   CustomException\  Util\
```

Root package holds only `MessReductionApplication.java`; stray `TestPass.java` sits directly under the package root.

### Repositories (`Repo\`) — complete
`ActivityLogRepository`, `AutoAcceptSettingsRepo`, `AuditLogRepo`, `AppNotificationRepository`, `NotificationReminderLogRepository`, `ExtraSubmissionRequestRepo`, `DepartmentRepo`, `QueuedNotificationRepository`, `PushSubscriptionRepository`, `ReductionFormHistoryRepo`, `ReductionFormRepo`, `StudentDetailsRepo`, `StaffUsersRepo`, `SystemSettingsRepo`.

### Controllers (`Controller\`)
`StudentDetailsController`, `StaffUsersController`, `StaffAuthController`, `ReductionFormController`, `PushSubscriptionController`, `NotificationController`, `DepartmentController`, `AuthController` (`/api/auth`: `POST /login`, `POST /verify-hostel`, `GET /hostel-verification-status`), `AdminController`, `ActivityLogController`.

### Security model (`security\SecurityConfig.java`)
- STATELESS JWT; `JwtFilter` before `UsernamePasswordAuthenticationFilter`; `JwtAuthEntryPoint` for unauthenticated.
- Roles: `Warden`, `DeputyWarden`, `Office` (staff), `STUDENT`, `ADMIN`.
- Public: `/`, static assets, `/api/auth/**`, `POST /api/student/reg`, `/api/staff/login`, swagger (`/v3/api-docs/**`, `/swagger-ui/**`, `/swagger-ui.html`).
- Path→role rules under `/api/hostelStaff/**` (e.g. `/api/hostelStaff/staff/warden/**` → `Warden`; `/api/hostelStaff/staff/deputyWarden/**` → `DeputyWarden`; `/api/hostelStaff/staff/office/**` → `Office`); `/api/student-form/**` → `STUDENT`; `/api/push/**` → staff roles + STUDENT; `/api/admin/**` → `ADMIN`; default `/api/**` → `authenticated()`.
- `passwordEncoder()` uses `DelegatingPasswordEncoder`.

### Client auth flow (`client/src/services/authService.js`)
- Students: localStorage `auth_token` + `user_type=STUDENT` + `student_data`; mirrored to sessionStorage `token`/`currentUser` for legacy compat.
- Staff: cookies `staffToken`/`staffUsername`/`staffRole` (7-day) for "legacy/backend API compatibility" + localStorage `auth_token`/`staff_role`/`staff_data`.
- `getStaffDashboardRoute(role, username)`: Warden→`/warden`, DeputyWarden→`/deputy`, Office→`/office`, ADMIN→`/admin/dashboard`.
- `apiClient.js`: axios baseURL from `VITE_API_BASE_URL || ''`; JWT attached from localStorage/sessionStorage/cookie `staffToken`; auth header skipped only for `POST /api/student/reg`; **no auto-logout on 401** — `ProtectedRoute` decides auth state.
- Service worker `/service-worker.js` registered in `main.jsx`.

## Gotchas

1. **DB conflict**: `pom.xml` + `server/README.md` say MySQL (`mysql-connector-j`), but `application.properties` runs PostgreSQL. When changing either, keep them consistent.
2. **Flyway V2–V4 migrations are copy-paste duplicates**: `V2__migrate_push_subscriptions_to_json.sql`, `V3__add_department_id_to_student_details.sql`, and `V4__drop_old_department_string_column.sql` all contain the identical body (`ALTER TABLE push_subscriptions CHANGE id id VARCHAR(255) NOT NULL;` in MySQL/SQL Server syntax — incompatible with PostgreSQL). Filenames misrepresent the bodies; V4 does not drop the department string column it claims to.
3. **`.gitignore` excludes `scratch/`, `jsb/`, `docs/`** — scratch material, not source of truth.
4. **Missing `db.json`** breaks the `npm run server` mock script (see Commands).
5. **glob tool doesn't find `.sql` files** on this repo — use direct file reads for migration files.
6. **Client README app map is stale/incomplete** — many extra root `.jsx` files exist beyond what it lists; trust `App.jsx` ROUTE_CONFIG instead.
7. **Never commit secrets** (`JWT_SECRET`, DB credentials, Firebase creds) — keys come from env vars.

## Tests

- Backend: JUnit tests in `server/src/test/java/com/hostel/MessReduction/Service/` (`*ServiceTest` files). Run with `mvn test`.
- No frontend test runner configured in `client/package.json`.
