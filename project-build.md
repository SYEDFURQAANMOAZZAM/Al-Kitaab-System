# Al-Kitaab: Project Build and Runtime Flow

## 1. What this project is

Al-Kitaab is a Next.js 16 App Router application for managing a madrasa. It uses React 19 for the interface, Prisma 7 with PostgreSQL for persistence, and JWTs stored in HTTP-only cookies for authentication.

The current, working feature set is centred on login/session management, role-based route access, branch and batch creation, seeded student/teacher data, and admin-side student/teacher listing. The schema already supports attendance and study-progress records, but there are no implemented write/read workflows for those records yet.

## 2. Project structure

| Area                                     | Responsibility                                                                                      |
| ---------------------------------------- | --------------------------------------------------------------------------------------------------- |
| `app/`                                   | Routes, layouts, server actions, and the refresh API route.                                         |
| `app/(auth)/`                            | Public login route; `/register` safely redirects to login because self-registration is not enabled. |
| `app/(user)/Admin`, `Teacher`, `Student` | Role-specific application areas. The route-group directory itself does not appear in URLs.          |
| `app/ServerActions/auth/`                | Login, logout, registration, and simple session-user validation.                                    |
| `app/ServerActions/creategroups/`        | Server actions to create branches and batches.                                                      |
| `lib/auth/`                              | JWT signing/verification, refresh-token hashing, and current-user lookup.                           |
| `proxy.ts`                               | Application-wide route protection and role routing.                                                 |
| `prisma/schema.prisma`                   | PostgreSQL data model.                                                                              |
| `prisma/init-db.ts`                      | Development data initializer for branches, batches, teachers, students, and their assignments.      |
| `components/`, `ServiceHandlers/`        | Shared UI and branch/batch form components.                                                         |

## 3. Route map

### Public routes

| URL                 | Current behaviour                                                                               |
| ------------------- | ----------------------------------------------------------------------------------------------- |
| `/`                 | Immediately redirects to `/login`.                                                              |
| `/login`            | Email/password form. An already authenticated user is sent to their role home.                  |
| `/register`         | Redirects to `/login`. Accounts are created by an administrator through the admin student form. |
| `/api/auth/refresh` | Refreshes a valid persisted refresh-token session and redirects back to a safe internal URL.    |

### Protected route roots

The proxy treats these prefixes as protected: `/Admin`, `/Teacher`, and `/Student`. It also enforces an exact corresponding role.

| Role      | Root       | Implemented destinations                                                                                                      |
| --------- | ---------- | ----------------------------------------------------------------------------------------------------------------------------- |
| `ADMIN`   | `/Admin`   | Redirects to `/Admin/dashboard`; dashboard, branches, student stats/add, teacher status, and several placeholder pages exist. |
| `TEACHER` | `/Teacher` | Root welcome page and `/Teacher/batches` placeholder exist.                                                                   |
| `STUDENT` | `/Student` | Root placeholder exists.                                                                                                      |

Navigation now exposes only implemented Teacher and Student destinations. Their dashboard links use the canonical protected roots, `/Teacher` and `/Student`; unavailable work-in-progress pages are not linked from the sidebar.

## 4. Authentication flow

### Login

```text
Browser submits email + password to login server action
  -> Look up User by email
  -> bcrypt.compare(submitted password, stored hash)
  -> On failure: return "Invalid credentials"
  -> On success: create access JWT (15 minutes) and refresh JWT (7 days)
  -> Delete all existing Session rows for that user (one active refresh session)
  -> Store SHA-256 hash of the new refresh JWT in Session
  -> Set both JWTs in HTTP-only, SameSite=Strict cookies
  -> Redirect by role: ADMIN /Admin, TEACHER /Teacher, STUDENT /Student
```

The application permits one active persisted refresh session per user: each successful login deletes that user's earlier session rows. A previous refresh token cannot be used after another login completes.

### JWT contents and storage

| Token         | Cookie          | JWT fields                                        | Lifetime   | Server-side state                             |
| ------------- | --------------- | ------------------------------------------------- | ---------- | --------------------------------------------- |
| Access token  | `access_token`  | `userId`, `role`, `type: "access"`                | 15 minutes | None; validity is checked cryptographically.  |
| Refresh token | `refresh_token` | `userId`, `role`, `type: "refresh"`, unique `jti` | 7 days     | Only its SHA-256 hash is stored in `Session`. |

Both cookies are `httpOnly`, `sameSite: "strict"`, scoped to `/`, and marked `secure` in production. Access and refresh JWTs use different secrets (`JWT_ACCESS_SECRET` and `JWT_REFRESH_SECRET`) and HS256 signatures. The raw refresh token is never put in the database.

### Accessing a protected page

```text
Request for /Admin, /Teacher, or /Student (including descendants)
  -> proxy.ts reads access_token
  -> Verify signature, expiry, type, userId, and role
  -> Compare token role with the protected URL prefix
  -> Valid and correct role: continue to the page
  -> Missing/invalid/expired access token:
       document navigation -> redirect to /api/auth/refresh?redirectTo=<requested path>
       non-document request -> JSON 401
  -> Valid token but wrong role -> redirect to /login
```

The proxy deliberately excludes `/api/auth/*` from its matcher so the refresh endpoint can run without being intercepted.

### Refresh and rotation

```text
GET /api/auth/refresh
  -> Read refresh_token cookie
  -> Verify refresh JWT signature, expiry, type, userId, and role
  -> Hash the raw token and find the matching Session record
  -> Require matching userId and unexpired Session.expiresAt
  -> In one transaction: conditionally consume old Session + create a Session for a new refresh token
  -> Set new 15-minute access and 7-day refresh cookies
  -> Redirect to a validated internal redirectTo path
```

The `redirectTo` parameter is accepted only if it begins with one slash, does not begin with `//`, and contains no backslash. This avoids an external redirect through the refresh endpoint. If token validation or the persisted session check fails, the endpoint clears both cookies and redirects to `/login`.

Refresh rotation also has a concurrency guard. The old session is deleted with a conditional `deleteMany` inside an interactive transaction; exactly one request can consume it. A second request that raced with the winner receives an internal redirect without clearing cookies, allowing the winning response to install the new cookies instead of incorrectly forcing a logout.

### Logout

```text
Sidebar logout form submits the logout server action
  -> Hash current refresh cookie (if present)
  -> Delete the matching Session record
  -> Expire access_token and refresh_token cookies
  -> Redirect to /login
```

The shared sidebar uses this correct form-based server-action flow. The current Teacher and Student root pages instead attach `logout` to a button `onClick`; since these pages are server components, that usage is not a valid interactive server-action pattern.

### Current-user lookup

`getCurrentUser()` reads and verifies the access cookie, then fetches the current `User` from the database with `id`, `email`, `name`, and `role`. React's `cache()` deduplicates this lookup within one request. `requireRole()` builds on it: it redirects unauthenticated users to `/login` and redirects authenticated users without an allowed role to their own role home. `AuthVerify()` now delegates to `requireRole()` and can receive the allowed role(s).

## 5. Authorization flow

Authorization is role-based. The database `Role` enum has exactly three values: `ADMIN`, `TEACHER`, and `STUDENT`.

| URL prefix | Required role |
| ---------- | ------------- |
| `/Admin`   | `ADMIN`       |
| `/Teacher` | `TEACHER`     |
| `/Student` | `STUDENT`     |

The primary enforcement point is `proxy.ts`, which checks the role contained in a valid access token before rendering a matched route. Auth pages reverse this logic: a valid access token redirects the visitor to their own home; an invalid access token with a valid refresh token first goes through token refresh.

The three role layouts are an independent server-side authorization boundary: Admin, Teacher, and Student layouts respectively call `requireRole("ADMIN")`, `requireRole("TEACHER")`, and `requireRole("STUDENT")`. Admin pages that use `AuthVerify` explicitly request `ADMIN` as well. Sensitive mutation actions likewise call `requireRole("ADMIN")` before processing input or accessing the database; proxy protection is no longer their only guard.

## 6. Data model and academic flow

```text
User (one role per account)
  ├── Student (optional one-to-one profile)
  │     ├── StudentEnrollment -> Batch -> Branch
  │     └── Progress -> Batch
  ├── Teacher (optional one-to-one profile)
  │     └── TeacherAssignment -> Batch -> Branch
  ├── Attendance -> Batch
  └── Session (hashed refresh-token records)
```

### Core entities

| Entity                | Purpose and important rules                                                                       |
| --------------------- | ------------------------------------------------------------------------------------------------- |
| `User`                | Account identity: unique email and optional unique phone, bcrypt password hash, role, timestamps. |
| `Student` / `Teacher` | Optional one-to-one role profiles linked to `User`.                                               |
| `Branch`              | Unique campus/location name.                                                                      |
| `Batch`               | A named class under one branch; unique per `(branchId, name)`.                                    |
| `StudentEnrollment`   | Many-to-many student-to-batch relationship; unique per `(studentId, batchId)`.                    |
| `TeacherAssignment`   | Many-to-many teacher-to-batch relationship; unique per `(teacherId, batchId)`.                    |
| `Attendance`          | Per user, batch, and date status (`PRESENT` or `ABSENT`), with optional remarks.                  |
| `Progress`            | Per student, batch, and date study status (`YES` or `NO`), score, and optional remarks.           |
| `Session`             | One-way hash of a refresh JWT, linked to a user and expiry timestamp.                             |

Student/teacher profiles and their enrollment/assignment records cascade-delete when their related profile or batch is deleted. Attendance and progress also cascade-delete with their user/student or batch.

Lookup indexes now exist on the `batchId` fields of `StudentEnrollment`, `TeacherAssignment`, `Attendance`, and `Progress`, supporting the batch-oriented queries that the application will use as these modules are implemented.

### Database initialization

Running `pnpm db:init` runs `prisma/init-db.ts`. It upserts two branches and five batches, then upserts five teacher users with profiles/assignments and 32 student users with profiles/enrollments. The seed script is idempotent for these records and uses a shared development password defined in that source file.

## 7. Implemented application workflows

### Admin dashboard

The dashboard queries counts of `Student` and `Teacher` profiles. The other displayed metrics and recent activity are currently static example data. Its AI assistant is presentational only; there is no Gemini/API implementation in this project.

### Branch and batch management

1. An authenticated visitor can open `/Admin/branches` (the proxy further requires `ADMIN`).
2. The page reads branches, batches, and per-batch student/teacher counts.
3. The branch form invokes `createBranch`, which first requires `ADMIN`, validates a non-empty name, inserts a `Branch`, then revalidates `/Admin/branches`.
4. A batch form binds its branch ID and invokes `createBatch`, which first requires `ADMIN`, validates the name and confirms the branch still exists, inserts a `Batch`, then revalidates the same page.
5. Database uniqueness prevents duplicate branch names and duplicate batch names within the same branch. Expected validation and duplicate-name failures are returned as structured form state and shown beside the relevant form rather than producing a 500 response.

Rename/delete menu entries are display-only; no matching actions are implemented.

### Student listing

`/Admin/students/stats` authenticates through `AuthVerify`, supports query-string search by student name or email, paginates at 15 records, and fetches each student with the linked user, enrollments, batches, and branches. The displayed attendance/progress values in the table are visual placeholders rather than computed `Attendance`/`Progress` data.

### Student creation form and actual result

The admin form at `/Admin/students/add` lets an admin select a branch and one or more batches. Client-side React Hook Form + Zod validation requires valid name/email/phone, a strong matching password, role `STUDENT`, one branch, and at least one batch.

The server action first requires `ADMIN` and repeats Zod validation. It parses the batch payload safely, confirms the submitted branch exists, and confirms every unique submitted batch belongs to that branch. It then uses one Prisma transaction to create the **User**, its `Student` profile, and every selected `StudentEnrollment`. It hashes the password with bcrypt (cost 10), maps unique-email/phone conflicts to a form message, revalidates the student/branch pages, and redirects to `/Admin/students/stats` after success.

### Teacher and student areas

The teacher status page lists all teacher profiles and their user names. The Teacher sidebar currently exposes its root and the batches placeholder; the Student sidebar exposes its root. Teacher creation, notices, material management, attendance entry, progress entry, reports, and analytics have no completed service flow in the checked source.

## 8. Current implementation boundaries and security follow-ups

This section records observed behaviour, not future design claims.

- An access token remains usable until its 15-minute expiry even after logout, because access JWTs have no server-side deny-list. The refresh session is invalidated immediately.
- Login deletes all sessions for a user, supporting only one refresh session at a time.
- There is no durable, distributed rate limit yet for login or refresh attempts. Add one backed by the deployment platform/Redis before production; an in-process limiter would not protect multiple server instances.
- The refresh concurrency guard prevents a racing request from clearing cookies, but token rotation is intentionally not multi-device session support: a new login still invalidates that user's prior refresh session.
- Sidebar labels are hard-coded as “Admin User” / “Admin” and are reused in every role layout; they do not reflect the authenticated user.
- Several navigation targets and feature pages are placeholders or missing. The README describes a broader roadmap than the operational source currently implements.

## 9. Local startup

1. Provide `DATABASE_URL`, `JWT_ACCESS_SECRET`, and `JWT_REFRESH_SECRET` through the local environment configuration.
2. Install packages with `pnpm install`.
3. Apply Prisma migrations/generate the client as required by the local database workflow.
4. Optionally run `pnpm db:init` to load the development dataset.
5. Start the app with `pnpm dev`.

Available scripts are `dev`, `build`, `start`, `lint`, and `db:init`.

## 10. Key source references

- Route gate and role matching: `proxy.ts`
- Token creation/verification: `lib/auth/tokens.ts`
- Current-user session lookup: `lib/auth/session.ts`
- Login and logout actions: `app/ServerActions/auth/login.tsx`
- Refresh-token rotation endpoint: `app/api/auth/refresh/route.ts`
- Server-side role guard: `lib/auth/require-role.ts`
- Registration and validated student/enrollment transaction: `app/ServerActions/auth/register.tsx`, `app/ServerActions/auth/Validate.tsx`
- Protected branch/batch actions: `app/ServerActions/creategroups/`
- Database model and initialization: `prisma/schema.prisma`, `prisma/init-db.ts`
