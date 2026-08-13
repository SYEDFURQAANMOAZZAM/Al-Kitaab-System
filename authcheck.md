# Access and Refresh Token Flow

This document describes the authentication flow implemented in this project. Authentication uses two JWTs stored in HTTP-only cookies:

| Token | Cookie | Lifetime | Purpose | Server-side state |
| --- | --- | --- | --- | --- |
| Access token | `access_token` | 15 minutes | Authenticates requests and supplies the user's role. | None |
| Refresh token | `refresh_token` | 7 days | Obtains a replacement access token and is rotated after use. | SHA-256 hash stored in `Session` |

Both cookies are scoped to `/`, use `httpOnly: true` and `sameSite: "strict"`, and are marked `secure` in production. The access and refresh tokens are signed with separate environment secrets: `JWT_ACCESS_SECRET` and `JWT_REFRESH_SECRET`.

## Token contents and validation

### Access token

`signAccessToken(userId, role)` creates an HS256 JWT containing:

```ts
{
  userId: string,
  role: "ADMIN" | "TEACHER" | "STUDENT",
  type: "access",
  iat: number,
  exp: number // issued-at time + 15 minutes
}
```

`verifyAccessToken(token)` validates the HS256 signature with `JWT_ACCESS_SECRET` and JWT expiry. It then requires all of the following:

1. `type` is exactly `"access"`.
2. `userId` is a string.
3. `role` is one of `ADMIN`, `TEACHER`, or `STUDENT`.

There is no database lookup or deny-list for an access token. Therefore, a previously issued access token can remain cryptographically valid until its 15-minute expiry, even if its matching refresh session is later removed.

### Refresh token

`signRefreshToken(userId, role)` creates an HS256 JWT containing:

```ts
{
  userId: string,
  role: "ADMIN" | "TEACHER" | "STUDENT",
  type: "refresh",
  iat: number,
  exp: number, // issued-at time + 7 days
  jti: string  // a newly generated UUID
}
```

`verifyRefreshToken(token)` validates the signature with `JWT_REFRESH_SECRET` and expiry. It also requires `type: "refresh"`, a string `userId`, and a supported role. An access token cannot be used as a refresh token, and a refresh token cannot be used as an access token because they use separate signing secrets and types.

The raw refresh JWT is never stored in the database. `hashRefreshToken()` produces a SHA-256 hash; that hash is the unique `Session.tokenHash` value persisted with `userId` and `expiresAt`.

## Login: issuing the first token pair

The `login` server action follows this flow:

```text
User submits email and password
        |
        v
Validate form input
        |
        +-- invalid -> return a generic validation error
        |
        v
Find User by email and compare bcrypt password hash
        |
        +-- no user / password mismatch -> return "Invalid credentials"
        |
        v
Create access JWT (15 minutes)
Create refresh JWT (7 days, new jti)
        |
        v
SHA-256 hash the refresh JWT and create a Session record
        |
        v
Set access_token and refresh_token HTTP-only cookies
        |
        v
Redirect to /Admin, /Teacher, or /Student based on the user's role
```

Each successful login creates a separate `Session` record. Existing sessions are not deleted, so multiple browsers/devices can each maintain an independent refresh session.

## Normal protected-route access

`proxy.ts` applies to app routes except `/api/auth/*`, Next static/image routes, and the favicon. It recognizes `/Admin`, `/Teacher`, and `/Student` as protected prefixes.

```text
Request for a protected route
        |
        v
Read access_token and refresh_token cookies
        |
        +-- no access token
        |      |
        |      +-- browser document request + refresh token -> redirect (303) to /api/auth/refresh
        |      |
        |      +-- otherwise -> 401 { error: "Unauthorized" }
        |
        v
Verify access token
        |
        +-- invalid, malformed, wrong type, wrong secret, or expired
        |      |
        |      +-- browser document request + refresh token -> redirect (303) to refresh endpoint
        |      +-- otherwise -> 401
        |
        v
Compare token role with requested route prefix
        |
        +-- different role -> redirect to that token role's home route
        |
        +-- matching role -> continue request
```

Only full browser document navigations are redirected to the refresh endpoint. API requests and server actions receive `401` instead, avoiding an HTML redirect response where a programmatic request expects an authorization error.

## Refresh: checking and rotating a token pair

The refresh endpoint is `GET /api/auth/refresh?redirectTo=<path>`. The proxy sends browser navigations there with status `303`, which ensures the refresh endpoint receives a `GET` even when the original navigation originated from a form submission.

`redirectTo` is accepted only when it is a safe internal path: it must start with one slash and may not begin with `//`, contain `\\`, or contain `://`. Unsafe or absent values fall back to `/Admin`.

```text
GET /api/auth/refresh
        |
        v
Read refresh_token cookie
        |
        +-- absent -> expire both cookies; 303 redirect to /login
        |
        v
Verify refresh JWT (signature, expiry, type, userId, role)
        |
        +-- failure -> expire both cookies; 303 redirect to /login
        |
        v
Hash the presented refresh token and look up Session by tokenHash
        |
        v
Check: session exists, session.userId equals JWT userId,
       and session.expiresAt is in the future
        |
        +-- failure -> delete matching session if present,
        |              expire both cookies; 303 redirect to /login
        |
        v
Use the current role from the Session's User relation
        |
        v
Generate a new access JWT (15 minutes)
Generate a new refresh JWT (7 days, new jti)
Hash the new refresh JWT
        |
        v
Database transaction:
  1. Delete the old Session only if its hash, userId, and unexpired state still match.
  2. Require exactly one record to have been deleted.
  3. Create the new Session with the new token hash and seven-day expiry.
        |
        v
Set both replacement cookies; Cache-Control: no-store
303 redirect to the safe requested path
```

The new JWTs use the session user's current database role rather than the role embedded in the presented refresh token. This means a role change takes effect the next time the refresh flow completes.

### Concurrent refresh protection

Two browser requests can try to refresh the same old token. The conditional delete inside the transaction allows only one request to consume it:

1. The first request deletes the old session and creates the replacement session.
2. The second request deletes zero records, so it is treated as `RefreshTokenAlreadyRotatedError`.
3. That second request redirects to the target path with `X-Refresh-Rotation: concurrent-request`, but does not clear cookies or create another session.

In the usual browser case, the first response's replacement cookies are then used on the redirected request.

## Authentication routes

For `/login` and `/register`, the proxy prevents an already authenticated user from staying on those pages:

1. A valid access token redirects immediately to the home route for its role.
2. If the access token is missing or invalid but the refresh token is valid on a browser document request, the proxy redirects to refresh and then to the role home route.
3. If no usable refresh token exists, the authentication page is rendered normally.

## Server-side user and role checks

The proxy is the first routing boundary, but pages, layouts, and sensitive server actions also use `requireRole()`.

```text
requireRole(allowedRoles...)
        |
        v
getCurrentUser()
  -> read access_token
  -> verify access JWT
  -> fetch current User (id, email, name, role) from database
        |
        +-- missing/invalid access token or absent user -> redirect /login
        |
        +-- current database role not allowed -> redirect to current role's home
        |
        +-- allowed -> return current user
```

`getCurrentUser()` is React-cached within a single request. Unlike proxy checks, `requireRole()` uses the user's current database role after validating the access token. `AuthVerify()` delegates to `requireRole()`; without parameters it allows all three known roles.

## Logout and invalidation

The `logout` server action:

1. Reads the current `refresh_token` cookie.
2. Hashes it and deletes only the matching `Session` record.
3. Expires both authentication cookies.
4. Redirects to `/login`.

This logs out the current browser/device without invalidating refresh sessions created by other logins. It immediately prevents further refreshes with this browser's refresh token. The access token is not server-revoked, but its cookie is removed; a copied access token could only remain valid until its 15-minute expiry.

## Main implementation files

- `lib/auth/tokens.ts` - token signing and cryptographic/payload validation.
- `lib/auth/token-hash.ts` - SHA-256 refresh-token hashing.
- `app/ServerActions/auth/login.tsx` - login, session creation, cookie setting, and logout.
- `app/api/auth/refresh/route.ts` - refresh-session checks and atomic rotation.
- `proxy.ts` - protected/auth route token checks and refresh redirects.
- `lib/auth/session.ts` and `lib/auth/require-role.ts` - database-backed current-user and role authorization checks.
- `prisma/schema.prisma` - `Session` persistence model.
