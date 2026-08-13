# JWT Refresh Rotation Fix Report

## Root cause corrected

The previous implementation read a `Session` row before its transaction, then
deleted it during rotation. A request that arrived after the winner committed
found no row and was incorrectly treated as an unknown token. Its generic error
path cleared both authentication cookies, including a replacement cookie that a
parallel response had just issued.

## Changes performed

1. Added `Session.rotatedAt` and migration
   `20260813100000_add_session_rotation_tombstone`.
   Rotating a token now marks its hash-only row as consumed rather than deleting
   it. The old row remains until its existing `expiresAt`, which is also the
   presented JWT's expiry. This is a database-backed tombstone, not client-side
   state.
2. Reworked `refreshSession()` into one Prisma transaction. It validates the
   JWT first, reads the matching session in the transaction, and atomically
   transitions only an active row (`rotatedAt: null`, unexpired) to consumed
   with `updateMany`. Only the winner creates a successor session.
3. Added explicit refresh outcomes: invalid/unknown session, expired DB
   session, and already-rotated token. A post-commit losing request sees the
   retained tombstone and receives `RefreshTokenAlreadyRotatedError`.
4. Updated the refresh route: only explicit invalid or expired outcomes clear
   cookies and redirect to login. A concurrent rotation redirects without any
   `Set-Cookie` deletion. Unexpected infrastructure failures also preserve
   cookies rather than manufacturing a logout.
5. Removed automatic refresh from `/login` and `/register`. A valid access
   token still redirects those routes to the user's home. An expired/invalid
   access token lets the auth page render instead of creating a refresh race.
6. Updated `requireRoleForAction()` so a concurrent rotation is propagated to
   the caller rather than redirected to login.
7. Confirmed access-token signing uses the intended `15m` expiry.

## Resulting flows

### A. Normal refresh

The proxy redirects an expired protected document/RSC request to the refresh
route. The transaction marks the old row with `rotatedAt`, inserts exactly one
new session row, and the route sends replacement access and refresh cookies.

### B. Two simultaneous refreshes

The first transaction changes the active old row to a tombstone and creates the
successor. The second request sees that tombstone, whether it read before or
after the first transaction committed. It redirects without clearing cookies and
never creates a second successor.

### C. Genuinely invalid refresh token

JWT verification failure, an unknown token hash, or a session owned by another
user produces `InvalidRefreshSessionError`. The route clears both cookies and
redirects to login.

### D. Expired DB session

An unrotated row whose `expiresAt` has passed produces
`ExpiredRefreshSessionError`; the expired active row is removed, cookies are
cleared, and the browser is redirected to login. A cryptographically expired
JWT is also invalid and follows the same secure sign-out behavior.

### E. Visiting `/login` with an old access token

A still-valid access token redirects to the role home. An expired or invalid
access token does not trigger refresh from the auth route, so `/login` renders
normally and no unnecessary token rotation occurs.

## Verification

`pnpm.cmd exec prisma generate` completed successfully. `pnpm.cmd exec tsc
--noEmit` still fails on four registration-form type errors outside the
authentication changes; it reported no errors in the modified auth files. Their
file separation is confirmed, but this dirty worktree does not establish when
those errors were introduced.
