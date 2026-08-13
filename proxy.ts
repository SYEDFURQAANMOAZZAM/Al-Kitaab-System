import { NextRequest, NextResponse } from "next/server";
import {
  verifyAccessToken,
} from "@/lib/auth/tokens";
import { authDebug } from "@/lib/auth/debug";

// ---------------------------------------------------------
// ROUTES
// ---------------------------------------------------------

const PROTECTED_ROUTES = [
  "/Admin",
  "/Teacher",
  "/Student",
] as const;

const AUTH_ROUTES = [
  "/login",
  "/register",
] as const;

const ROUTE_ROLES = {
  "/Admin": "ADMIN",
  "/Teacher": "TEACHER",
  "/Student": "STUDENT",
} as const;

type Role = (typeof ROUTE_ROLES)[keyof typeof ROUTE_ROLES];

type AuthError =
  | "unauthorized"
  | "session-expired"
  | "invalid-session";

// ---------------------------------------------------------
// PROXY
// ---------------------------------------------------------

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // -------------------------------------------------------
  // 1. Determine route type
  // -------------------------------------------------------

  const isProtectedRoute = PROTECTED_ROUTES.some((route) =>
    matchesRoute(pathname, route)
  );

  const isAuthRoute = AUTH_ROUTES.some((route) =>
    matchesRoute(pathname, route)
  );

  // -------------------------------------------------------
  // 2. Read authentication cookies
  // -------------------------------------------------------

  const accessToken =
    request.cookies.get("access_token")?.value;

  const refreshToken =
    request.cookies.get("refresh_token")?.value;

  // -------------------------------------------------------
  // 3. Determine request type
  // -------------------------------------------------------
  //
  // A navigation can be a full browser document request or a Next.js
  // React Server Component request made by <Link>. Both must be able
  // to refresh an expired access token.
  //
  // API / server-action requests should receive 401 instead
  // of being redirected to an HTML page.
  //

  const isDocumentRequest =
    request.headers.get("sec-fetch-dest") === "document";

  const isServerActionRequest =
    request.method === "POST" &&
    request.headers.has("next-action");

  if (isServerActionRequest) {
    return NextResponse.next();
  }



  const isRscNavigationRequest =
    request.headers.has("rsc") &&
    !isServerActionRequest;
  const isPageNavigationRequest =
    isDocumentRequest || isRscNavigationRequest;

  authDebug("proxy.request", {
    pathname,
    protectedRoute: isProtectedRoute,
    authRoute: isAuthRoute,
    pageNavigation: isPageNavigationRequest,
    hasAccessCookie: Boolean(accessToken),
    hasRefreshCookie: Boolean(refreshToken),
  });

  // -------------------------------------------------------
  // PROTECTED ROUTES
  // -------------------------------------------------------

  if (isProtectedRoute) {
    // -----------------------------------------------------
    // No access token
    // -----------------------------------------------------

    if (!accessToken) {
      // Access token missing but refresh token exists.
      //
      // Try to restore the session.
      if (isPageNavigationRequest && refreshToken) {
        authDebug("proxy.refresh-required", { pathname, reason: "missing-access" });
        return redirectToRefresh(request);
      }

      // Browser navigation with no usable authentication.
      if (isPageNavigationRequest) {
        return redirectToLogin(
          request,
          "unauthorized"
        );
      }

      // API/server action.
      return unauthorizedResponse();
    }

    // -----------------------------------------------------
    // Verify access token
    // -----------------------------------------------------

    try {
      const { role } =
        await verifyAccessToken(accessToken);

      // ---------------------------------------------------
      // Check role permission
      // ---------------------------------------------------

      const requiredRole =
        getRequiredRole(pathname);

      if (
        requiredRole &&
        role !== requiredRole
      ) {
        // User is authenticated but trying to access
        // another role's section.
        return NextResponse.redirect(
          new URL(
            homeForRole(role),
            request.url
          ),
          303
        );
      }

      // Authentication + authorization successful.
      return NextResponse.next();

    } catch {
      // ---------------------------------------------------
      // Access token invalid / expired
      // ---------------------------------------------------
      if (isPageNavigationRequest && refreshToken) {
        authDebug("proxy.refresh-required", { pathname, reason: "invalid-access" });
        return redirectToRefresh(request);
      }
      // Browser has no usable refresh session.
      if (isPageNavigationRequest) {
        return redirectToLogin(
          request,
          "session-expired"
        );
      }

      // API/server action.
      return unauthorizedResponse();
    }
  }

  // ---------------------------------------------------------
  // AUTH ROUTES
  // ---------------------------------------------------------
  //
  // /login
  // /register
  //

  if (isAuthRoute) {
    // -------------------------------------------------------
    // Access token already valid
    // -------------------------------------------------------

    if (accessToken) {
      try {
        const { role } =
          await verifyAccessToken(accessToken);

        // Already logged in.
        return NextResponse.redirect(
          new URL(
            homeForRole(role),
            request.url
          ),
          303
        );

      } catch {
        // A refresh session can still prove this is an authenticated user.
      }
    }

    // Auth routes are guest-only. Recover the session before rendering them so
    // an expired access token does not show an authenticated user a login form.
    if (isPageNavigationRequest && refreshToken) {
      authDebug("proxy.refresh-required", { pathname, reason: "guest-route" });
      return redirectToRefresh(request);
    }

    return NextResponse.next();
  }

  // ---------------------------------------------------------
  // PUBLIC ROUTES
  // ---------------------------------------------------------

  return NextResponse.next();
}

// =========================================================
// REFRESH REDIRECT
// =========================================================

function redirectToRefresh(
  request: NextRequest,
  redirectTo?: string
) {
  const refreshUrl = new URL(
    "/api/auth/refresh",
    request.url
  );

  const target =
    redirectTo ??
    `${request.nextUrl.pathname}${request.nextUrl.search}`;

  // Only allow safe internal paths.
  const safeTarget =
    isSafeRelativePath(target)
      ? target
      : "/";

  refreshUrl.searchParams.set(
    "redirectTo",
    safeTarget
  );

  /*
   * IMPORTANT:
   *
   * 303 means the browser performs the next request
   * as GET.
   *
   * Therefore:
   *
   * POST /api/auth/refresh → 405
   *
   * cannot happen because of this redirect.
   */

  return NextResponse.redirect(
    refreshUrl,
    303
  );
}

// =========================================================
// LOGIN REDIRECT
// =========================================================

function redirectToLogin(
  request: NextRequest,
  error: AuthError
) {
  const loginUrl = new URL(
    "/login",
    request.url
  );

  // Send only a safe error code.
  //
  // Never expose:
  // JWT errors
  // Prisma errors
  // stack traces
  // internal implementation details

  loginUrl.searchParams.set(
    "error",
    error
  );

  const response =
    NextResponse.redirect(
      loginUrl,
      303
    );

  // Prevent caching of authentication redirects.
  response.headers.set(
    "Cache-Control",
    "no-store"
  );

  return response;
}

// =========================================================
// ROLE HELPERS
// =========================================================

function getRequiredRole(
  pathname: string
): Role | undefined {
  const match =
    Object.entries(
      ROUTE_ROLES
    ).find(([route]) =>
      matchesRoute(pathname, route)
    );

  return match?.[1];
}

function homeForRole(
  role: Role
) {
  switch (role) {
    case "ADMIN":
      return "/Admin";

    case "TEACHER":
      return "/Teacher";

    case "STUDENT":
      return "/Student";
  }
}

// =========================================================
// ROUTE HELPERS
// =========================================================

function matchesRoute(
  pathname: string,
  route: string
) {
  return (
    pathname === route ||
    pathname.startsWith(`${route}/`)
  );
}

// =========================================================
// REDIRECT VALIDATION
// =========================================================

function isSafeRelativePath(
  path: string | null
): path is string {
  return Boolean(
    path &&
      path.startsWith("/") &&
      !path.startsWith("//") &&
      !path.includes("\\") &&
      !path.includes("://")
  );
}

// =========================================================
// API UNAUTHORIZED RESPONSE
// =========================================================

function unauthorizedResponse() {
  return NextResponse.json(
    {
      error: "Unauthorized",
    },
    {
      status: 401,
      headers: {
        "Cache-Control": "no-store",
      },
    }
  );
}

// =========================================================
// PROXY CONFIG
// =========================================================

export const config = {
  matcher: [
    "/((?!api/auth|_next/static|_next/image|favicon.ico).*)",
  ],
};
