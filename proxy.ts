import { NextRequest, NextResponse } from "next/server";
import { verifyAccessToken, verifyRefreshToken } from "@/lib/auth/tokens";

const PROTECTED_ROUTES = ["/Admin", "/Teacher", "/Student"];
const AUTH_ROUTES = ["/login", "/register"];

const ROUTE_ROLES = {
  "/Admin": "ADMIN",
  "/Teacher": "TEACHER",
  "/Student": "STUDENT",
} as const;

export async function proxy(request: NextRequest) {
  const path = request.nextUrl.pathname;

  const isProtected = PROTECTED_ROUTES.some((route) =>
    matchesRoute(path, route)
  );

  const isAuthRoute = AUTH_ROUTES.some((route) =>
    matchesRoute(path, route)
  );

  const accessToken = request.cookies.get("access_token")?.value;
  const refreshToken = request.cookies.get("refresh_token")?.value;

  // Only refresh full page navigations.
  const isDocument =
    request.headers.get("sec-fetch-dest") === "document";

  if (isProtected) {
    if (!accessToken) {
      if (isDocument) {
        return redirectToRefresh(request);
      }

      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    try {
      const { role } = await verifyAccessToken(accessToken);

      const requiredRole = Object.entries(ROUTE_ROLES).find(
        ([route]) => matchesRoute(path, route)
      )?.[1];

      if (requiredRole && role !== requiredRole) {
        return NextResponse.redirect(
          new URL("/login", request.url)
        );
      }

      return NextResponse.next();
    } catch {
      if (isDocument) {
        return redirectToRefresh(request);
      }

      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }
  }

  if (isAuthRoute) {
    if (accessToken) {
      try {
        const { role } = await verifyAccessToken(accessToken);

        return NextResponse.redirect(
          new URL(homeForRole(role), request.url)
        );
      } catch {
        // Continue with the refresh-token check below.
      }
    }

    if (refreshToken) {
      try {
        const { role } = await verifyRefreshToken(refreshToken);
        return redirectToRefresh(request, homeForRole(role));
      } catch {
        // An invalid or expired refresh token cannot restore the session.
      }
    }
  }

  return NextResponse.next();
}

function redirectToRefresh(request: NextRequest, redirectTo?: string) {
  const refreshUrl = new URL("/api/auth/refresh", request.url);

  refreshUrl.searchParams.set(
    "redirectTo",
    redirectTo ?? `${request.nextUrl.pathname}${request.nextUrl.search}`
  );

  return NextResponse.redirect(refreshUrl);
}

function homeForRole(
  role: "ADMIN" | "TEACHER" | "STUDENT"
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

function matchesRoute(path: string, route: string) {
  return path === route || path.startsWith(`${route}/`);
}

export const config = {
  matcher: [
    "/((?!api/auth|_next/static|_next/image|favicon.ico).*)",
  ],
};
