# JWT Refresh Rotation Race Report

## Scope and evidence

This is a read-only assessment of the current implementation. It is based on
the supplied request sequence and the code in `proxy.ts`,
`app/api/auth/refresh/route.ts`, and `lib/auth/refresh-session.tsx`.

The reported sequence is consistent with the implementation:

1. Request A finds the old refresh-session row, consumes it, creates a new row,
   and returns replacement cookies.
2. Request B, which was already sent with the old cookie, can reach the database
   after A committed.
3. B then cannot find a session for the old token, throws `Invalid refresh
   session`, and the refresh route's generic handler calls `redirectToLogin()`.
4. `redirectToLogin()` sends `Set-Cookie` expirations for both `access_token`
   and `refresh_token`. Those response cookies can remove the replacement
   cookies set by A, causing the observed logout.

The fact that the database still contains the session created by A does not
protect the browser: B's response clears the browser cookies, but does not
delete A's newly-created session row. This exactly explains a valid session row
coexisting with a signed-out browser.

## Finding 1: refresh-token rotation race is confirmed

**Confirmed.** The refresh-token rotation is atomic at consumption time, but
the complete browser refresh flow is not concurrency-safe.

`refreshSession()` first performs `findUnique()` outside the transaction. If no
old session is found, it immediately throws the generic `Error("Invalid refresh
session")` (lines 34-69). Only requests that successfully completed this initial
lookup proceed to the transaction and can throw
`RefreshTokenAlreadyRotatedError` (lines 91-103).

Consequently, there are two distinct concurrent timelines:

| Timing | Result | Route behavior |
| --- | --- | --- |
| A and B both read the old row before A consumes it | A wins; B's conditional delete affects zero rows | B throws `RefreshTokenAlreadyRotatedError`; its response does not clear cookies. |
| A consumes and commits before B does `findUnique()` | B finds no old row | B throws generic `Invalid refresh session`; its response clears both cookies. |

The second timeline is the failure described in the supplied logs. The
transaction prevents two replacement sessions from being created from one token,
but it does not classify an already-consumed old token consistently across the
whole method.

## Finding 2: `RefreshTokenAlreadyRotatedError` handling is not sufficient

**Not sufficient.** The special handling in the refresh route is correct only
for the narrow transaction-race case. It does not cover the more likely case
where the losing request reaches the initial lookup after the winner has
committed.

The refresh route handles only `RefreshTokenAlreadyRotatedError` without
clearing cookies (lines 57-82). All other errors, including the generic missing
old-session error, take the generic catch path (line 86), whose
`redirectToLogin()` expires both cookies (lines 131-164).

There is an additional timing assumption even in the special-error branch: it
redirects without issuing cookies and assumes the winning response's
`Set-Cookie` has already been applied by the browser before the redirected
request is made. Parallel response and redirect ordering can make that
assumption fragile.

The same refresh helper is also used by `requireRoleForAction()`. Its special
error branch redirects the action to `/login` rather than recovering the action
(lines 105-119 of `lib/auth/require-role.ts`). It does not clear cookies, so it
is not the direct cookie-deletion cause, but it is another caller for which the
concurrent-rotation outcome is not recovered.

## Finding 3: `/login` currently participates in refresh

**Confirmed.** `/login` and `/register` are included in `AUTH_ROUTES`. When the
access token is absent or invalid and a cryptographically valid refresh token
is present on a document or RSC navigation, the proxy calls
`redirectToRefresh()` (lines 232-255 of `proxy.ts`). It redirects to the
user's role home after rotation.

This behavior is intentional in the current code: it keeps a user with a valid
refresh session from seeing an auth page when their access token has expired.
It is nevertheless an unnecessary refresh trigger for a public login visit,
and it increases the number of requests that can contend for the same refresh
token. The issue applies equally to `/register`.

Whether those routes *should* be excluded depends on the intended product
behavior:

- If protected-route access is the only place where automatic session recovery
  is needed, exclude `/login` and `/register` from refresh handling. A visit to
  either page will then render normally once the access token is expired.
- If authenticated users must always be returned to their role home when they
  visit auth routes, retaining automatic recovery is valid, but it must be made
  concurrency-safe first and will continue to create avoidable rotation load.

For the stated logout problem, excluding the auth routes is a sensible
mitigation, but it is not a complete fix: parallel protected-route document/RSC
requests can still reproduce the same race.

## Related observations

- `proxy.ts` treats both document and RSC requests as navigation requests
  (lines 75-83). This correctly fixes expired-token navigation, but means a
  single UI transition can generate more opportunities to enter refresh.
- The duplicate `if (isPageNavigationRequest && refreshToken)` block in the
  protected-route verification catch (lines 175-187) is redundant but does not
  itself issue two redirects; the first branch returns.
- The success log in the refresh route is unreachable because it follows
  `return response` (lines 50-56). This does not cause logout, but it limits
  the evidence available while diagnosing races.
- Access-token issuance currently uses `setExpirationTime('1m')` in
  `lib/auth/tokens.ts`, while cookie lifetime and documentation say 15 minutes.
  This does not create the rotation race, but it causes refresh attempts roughly
  fifteen times more frequently than intended and therefore makes the race much
  easier to encounter.

## Conclusion

The hypothesis is accepted. A concurrent request using the just-rotated old
refresh token can be misclassified as an invalid session, and the generic
failure response clears the newly-issued cookies. The existing
`RefreshTokenAlreadyRotatedError` path prevents logout only for one timing
window and is therefore incomplete. `/login` (and, for consistency,
`/register`) currently trigger refresh; excluding them reduces unnecessary
contention but does not independently solve concurrent refreshes from protected
routes.
