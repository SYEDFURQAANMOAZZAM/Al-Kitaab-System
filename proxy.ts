import { NextRequest, NextResponse } from "next/server";
import {
  verifyAuthToken,
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

// ---------------------------------------------------------
// PROXY
// ---------------------------------------------------------

/**
 * Authentication middleware.
 *
 * Responsibilities:
 * 1. Verify JWT from auth_token cookie
 * 2. Basic role-based route screening
 * 3. Guest-only route enforcement
 *
 * Does NOT:
 * - Refresh tokens
 * - Authorize sensitive operations (delegated to Server Actions)
 * - Redirect Server Actions (they handle their own auth)
 */
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
  // 2. Read authentication cookie
  // -------------------------------------------------------

  const authToken =
    request.cookies.get("auth_token")?.value;

  // -------------------------------------------------------
  // 3. Determine request type
  // -------------------------------------------------------

  const isServerActionRequest =
    request.method === "POST" &&
    request.headers.has("next-action");

  // Server Actions handle their own authentication via requireRoleForAction()
  if (isServerActionRequest) {
    return NextResponse.next();
  }

  authDebug("proxy.request", {
    pathname,
    isProtectedRoute,
    isAuthRoute,
    hasAuthToken: Boolean(authToken),
  });

  // -------------------------------------------------------
  // PROTECTED ROUTES
  // -------------------------------------------------------

  if (isProtectedRoute) {
    // No authentication token
    if (!authToken) {
      authDebug("proxy.unauthorized", { pathname, reason: "missing-auth-token" });
      return redirectToLogin(request);
    }

    // Verify authentication token
    try {
      const { role } =
        await verifyAuthToken(authToken);

      // ---------------------------------------------------
      // Basic role screening
      // ---------------------------------------------------

      const requiredRole =
        getRequiredRole(pathname);

      if (
        requiredRole &&
        role !== requiredRole
      ) {
        // User is authenticated but trying to access
        // another role's section. Redirect to their home.
        authDebug("proxy.role-mismatch", {
          pathname,
          requiredRole,
          userRole: role,
        });
        return NextResponse.redirect(
          new URL(
            homeForRole(role),
            request.url
          ),
          303
        );
      }

      // Authentication + basic authorization successful.
      authDebug("proxy.allowed", { pathname, role });
      return NextResponse.next();

    } catch (error) {
      // ---------------------------------------------------
      // Token invalid or expired
      // ---------------------------------------------------
      // There is NO refresh mechanism.
      // Invalid/expired token means unauthenticated.
      authDebug("proxy.token-invalid", {
        pathname,
        error: error instanceof Error ? error.message : String(error),
      });
      return redirectToLogin(request);
    }
  }

  // ---------------------------------------------------------
  // AUTH ROUTES (/login, /register)
  // ---------------------------------------------------------
  //
  // These routes must remain guest-only.
  // If authenticated, redirect to home.
  //

  if (isAuthRoute) {
    // -------------------------------------------------------
    // Already authenticated
    // -------------------------------------------------------

    if (authToken) {
      try {
        const { role } =
          await verifyAuthToken(authToken);

        // Already logged in. Redirect to home.
        authDebug("proxy.authenticated-user-on-auth-route", {
          pathname,
          role,
        });
        return NextResponse.redirect(
          new URL(
            homeForRole(role),
            request.url
          ),
          303
        );

      } catch {
        // Token is invalid/expired. User is not authenticated.
        // Allow access to auth route.
      }
    }

    // User is not authenticated. Allow access to auth route.
    authDebug("proxy.guest-route-allowed", { pathname });
    return NextResponse.next();
  }

  // ---------------------------------------------------------
  // PUBLIC ROUTES
  // ---------------------------------------------------------

  return NextResponse.next();
}

// =========================================================
// LOGIN REDIRECT
// =========================================================

function redirectToLogin(request: NextRequest) {
  const loginUrl = new URL("/login", request.url);

  const response =
    NextResponse.redirect(loginUrl, 303);

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
// PROXY CONFIG
// =========================================================

export const config = {
  matcher: [
    "/((?!api/auth|_next/static|_next/image|favicon.ico).*)",
  ],
};
