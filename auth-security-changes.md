# Authentication security changes

## Scope

This report records the authentication changes made during the August 2026 audit. It intentionally does not change unrelated student, attendance, batch, branch, or UI behavior.

## Changes made

### Guest-only auth routes

- `proxy.ts` now sends a document or RSC request for `/login` or `/register` to `/api/auth/refresh` whenever an access token is missing or invalid but a refresh cookie exists.
- `app/api/auth/refresh/route.ts` sends a successful refresh from either auth route directly to the refreshed user's role home (`/Admin`, `/Teacher`, or `/Student`).
- A valid access token continues to be redirected by the proxy before either auth page can render.
- No usable refresh session still reaches the login/register page after the refresh endpoint clears invalid cookies.

### Token validation

- `lib/auth/tokens.ts` now fails clearly when either signing secret is absent.
- Access and refresh JWTs now include distinct issuer and audience claims.
- Verification enforces `HS256`, issuer, audience, expiration, issued-at time, token type, user ID, and role. Refresh verification also requires a JTI.
- Secrets remain server-only environment values; no secret or refresh token is exposed to client code.

### Concurrent refresh handling

- Refresh rotation remains atomic: the old session row is tombstoned using a conditional update before exactly one replacement session is inserted.
- A losing HTTP refresh request is redirected back to its target without clearing cookies. The winning browser response supplies the replacement cookies; the losing request never creates a second active session and never logs the user out.
- A Server Action that loses this race redirects to the verified token role home instead of exposing `RefreshTokenAlreadyRotatedError`. The action is not replayed automatically, preventing duplicate mutations.

### Email canonicalization

- Added `lib/auth/email.ts` with a single lower-case, trimmed canonicalization function.
- Login lookup, student creation, teacher creation, and student email updates use it consistently.
- Existing stored mixed-case email records are not migrated by this change; those should be normalized through a reviewed data migration before enforcing a database-level canonical uniqueness rule.

### Redirect safety

- Safe redirect validation still rejects external/protocol-relative/backslash targets.
- Invalid redirect targets now fall back to `/`, not the ADMIN-specific route.
- A transient refresh database/infrastructure failure returns a non-cacheable `503` and preserves cookies; it is not misrepresented as an expired session or redirected into `/login`.

## Audit findings retained by design

- `getCurrentUser()` remains read-only. It verifies only the access JWT and reads the current user from the database.
- Layout and Server Action authorization therefore uses the database role and rejects deleted users, even if an old access-token role still exists. The proxy deliberately avoids a database query on every request; a stale token can pass route-level screening briefly, but the layout/action is the authoritative database boundary.
- Refresh rotation obtains the current database role, so the next token reflects a role change.
- Refresh lifetime is sliding: every successful refresh issues a new seven-day refresh JWT and session. There is no absolute maximum session lifetime at present.
- Password reset/change functionality was not found. A future password-change feature should revoke all of that user's refresh sessions in the same transaction.
- No scheduled session cleanup job was found. Run a scheduled cleanup that removes expired active sessions and rotated tombstones only after the original refresh JWT could no longer be valid. Do not add that cleanup to normal request paths.
- Login uses generic credential failures and bcrypt, but no distributed rate limiter is configured. Add a shared production rate limiter (for example Redis- or gateway-backed) before exposing login broadly; an in-memory limiter would not be sufficient across instances.
- Refresh remains `GET` because proxy redirects must support both document and RSC navigation without client-side access to the HttpOnly refresh cookie. It is same-site cookie protected, accepts only validated internal return paths, and is excluded from proxy recursion.

## Server Action authorization audit

| Action | Authorization |
| --- | --- |
| `registerStudent` / `updateStudent` | ADMIN or TEACHER |
| `registerTeacher`, `createBranch`, `createBatch` | ADMIN |
| `getBatchMembers` | ADMIN or TEACHER |
| `login` | Public credential endpoint |
| `logout` | Revokes only the current refresh session |

## Files changed in this audit

- `proxy.ts` — guest-route refresh recovery and role-neutral fallback.
- `app/api/auth/refresh/route.ts` — send refreshed auth-route visits to the correct role home.
- `lib/auth/tokens.ts` — hardened JWT construction and runtime verification.
- `lib/auth/require-role.ts` — safe Server Action behavior for a concurrent rotation loser.
- `lib/auth/email.ts` — canonical email helper.
- `app/ServerActions/auth/login.ts` — canonical login lookup.
- `app/ServerActions/auth/registeration/registerStudent.ts` — canonical student email persistence.
- `app/ServerActions/auth/registeration/registerTeacher.ts` — canonical teacher email persistence.
- `app/ServerActions/auth/updation/updateStudent.ts` — canonical student email updates.

## Validation performed

- `pnpm.cmd lint` completed with no errors; it reports nine existing warnings outside authentication.
- `pnpm.cmd exec tsc --noEmit` remains blocked by four existing registration-form type errors in `components/registerComponent.tsx` and the student/teacher add pages; none are in the changed authentication files.
- `pnpm.cmd build` is blocked in this environment because `next/font` cannot fetch the Google-hosted Geist font. The build did not report an authentication compilation error.
- No browser/database integration harness exists in this repository, so the full HTTP and concurrent-refresh matrix was not executed automatically.

## Debug diagnostics

- `AUTH_DEBUG=true` enables concise server-side `AUTH_DEBUG` events in the proxy and refresh endpoint; these logs are also enabled during local development and remain disabled in production unless explicitly enabled.
- Events include route classification, cookie-presence booleans, refresh reason, destination, and outcome only. They never include cookie values, JWTs, secrets, user IDs, emails, or database error details.
