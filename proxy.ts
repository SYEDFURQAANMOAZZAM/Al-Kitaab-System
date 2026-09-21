import { NextRequest, NextResponse } from "next/server";
import { verifyAuthToken } from "@/lib/auth/tokens";
import { authDebug } from "@/lib/auth/debug";

// ---------------------------------------------------------
// ROUTES
// ---------------------------------------------------------

const PROTECTED_ROUTES = [
  "/admin",
  "/teacher",
  "/student",
] as const;

const AUTH_ROUTES = [
  "/login",
  "/register",
] as const;

const ROUTE_ROLES = {
  "/admin": "ADMIN",
  "/teacher": "TEACHER",
  "/student": "STUDENT",
} as const;

type Role = (typeof ROUTE_ROLES)[keyof typeof ROUTE_ROLES];

// ---------------------------------------------------------
// PROXY
// ---------------------------------------------------------

export async function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

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

  const authToken = request.cookies.get("auth_token")?.value;

  // -------------------------------------------------------
  // 3. Server Actions
  // -------------------------------------------------------

  const isServerActionRequest =
    request.method === "POST" &&
    request.headers.has("next-action");

  // Server Actions perform their own authorization.
  if (isServerActionRequest) {
    return NextResponse.next();
  }

  authDebug("proxy.request", {
    pathname,
    isProtectedRoute,
    isAuthRoute,
    hasAuthToken: Boolean(authToken),
  });

  // =======================================================
  // PROTECTED ROUTES
  // =======================================================

  if (isProtectedRoute) {
    // -----------------------------------------------------
    // No authentication
    // -----------------------------------------------------

    if (!authToken) {
      authDebug("proxy.unauthorized", {
        pathname,
        reason: "missing-auth-token",
      });

      return redirectToLogin(request);
    }

    // -----------------------------------------------------
    // Verify token
    // -----------------------------------------------------

    try {
      const { role } = await verifyAuthToken(authToken);

      const requiredRole = getRequiredRole(pathname);

      // ---------------------------------------------------
      // Unauthorized role
      // ---------------------------------------------------

      if (requiredRole && role !== requiredRole) {
        authDebug("proxy.role-mismatch", {
          pathname,
          requiredRole,
          userRole: role,
        });

        return NextResponse.redirect(
          new URL(homeForRole(role), request.url),
          303
        );
      }

      // ---------------------------------------------------
      // Authorized
      // ---------------------------------------------------

      authDebug("proxy.allowed", {
        pathname,
        role,
      });

      return NextResponse.next();
    } catch (error) {
      authDebug("proxy.token-invalid", {
        pathname,
        error:
          error instanceof Error
            ? error.message
            : String(error),
      });

      return redirectToLogin(request);
    }
  }

  // =======================================================
  // AUTH ROUTES
  // =======================================================

  if (isAuthRoute) {
    if (authToken) {
      try {
        const { role } = await verifyAuthToken(authToken);

        // Already authenticated.
        // No callback requested, so go to role home.
        return NextResponse.redirect(
          new URL(homeForRole(role), request.url),
          303
        );
      } catch {
        // Invalid token.
        // Allow access to login/register.
      }
    }

    return NextResponse.next();
  }

  // =======================================================
  // PUBLIC ROUTES
  // =======================================================

  return NextResponse.next();
}

// =========================================================
// LOGIN REDIRECT
// =========================================================

function redirectToLogin(request: NextRequest) {
  const loginUrl = new URL("/login", request.url);

  // Preserve the exact originally requested URL.
  const requestedUrl =
    request.nextUrl.pathname +
    request.nextUrl.search;

  loginUrl.searchParams.set(
    "callbackUrl",
    requestedUrl
  );

  const response =
    NextResponse.redirect(loginUrl, 303);

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
  const match = Object.entries(ROUTE_ROLES).find(
    ([route]) => matchesRoute(pathname, route)
  );

  return match?.[1];
}

function homeForRole(role: Role) {
  switch (role) {
    case "ADMIN":
      return "/admin";

    case "TEACHER":
      return "/teacher";

    case "STUDENT":
      return "/student";
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