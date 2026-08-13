# Authentication session refresh fix

## Problem

The refresh JWT and its cookie both have a seven-day lifetime. The access JWT has a deliberately short, 15-minute lifetime.

After the access token expired, sidebar navigation used Next.js `<Link>` requests. Those are React Server Component (RSC) requests, not full document requests. The proxy previously considered only requests with `sec-fetch-dest: document` to be navigations that could use the refresh token. An RSC request with an expired access token therefore received `401 Unauthorized` instead of being sent to `/api/auth/refresh`. The protected layout then had no valid access token and redirected to `/login`.

This made a valid seven-day refresh session appear to have expired much sooner.

## Change

`proxy.ts` now treats both of these as page navigations:

- A normal browser document request (`sec-fetch-dest: document`).
- A Next.js RSC navigation request (`RSC` request header), such as a sidebar `<Link>` click.

When either request has no access token or has an expired access token, and a refresh token is present, the proxy redirects to `/api/auth/refresh`. That endpoint validates the refresh JWT and its persisted `Session` record, rotates both tokens, and returns the user to their requested page.

API and server-action requests are unchanged: they still receive `401` rather than an HTML redirect.

## Result

An active user can continue navigating after the 15-minute access token expires without signing in again. Each successful refresh also issues a new seven-day refresh token and matching database session, so the session remains active while it continues to be used.

## Remaining causes of a real sign-out

A user will still need to sign in if the refresh cookie cannot be validated. Common reasons are:

- The refresh JWT and the corresponding database `Session` have passed their seven-day expiry.
- The session row was deleted (for example, logout or a database reset).
- `JWT_REFRESH_SECRET` changed after the token was issued.
- The user opened the app on a different hostname, such as changing between `localhost` and a dev-tunnel address. Cookies are host-specific.
