import { NextRequest, NextResponse } from "next/server";

import {
  refreshSession,
  ExpiredRefreshSessionError,
  InvalidRefreshSessionError,
  RefreshTokenAlreadyRotatedError,
} from "@/lib/auth/refresh-session";
import { authDebug } from "@/lib/auth/debug";

export async function GET(request: NextRequest) {
  const refreshToken =
    request.cookies.get("refresh_token")?.value;

  const requestedRedirectTo =
    request.nextUrl.searchParams.get("redirectTo");

  const redirectTo = isSafeRelativePath(requestedRedirectTo)
    ? requestedRedirectTo
    : null;

  if (!refreshToken) {
    authDebug("refresh.rejected", { reason: "missing-cookie" });
    return redirectToLogin(request);
  }

  try {
    const {
      accessToken,
      refreshToken: newRefreshToken,
      role,
    } = await refreshSession(refreshToken);

    const destination =
      !redirectTo || isAuthRoute(redirectTo)
        ? homeForRole(role)
        : redirectTo;

    authDebug("refresh.succeeded", {
      destination,
      fromAuthRoute: Boolean(redirectTo && isAuthRoute(redirectTo)),
    });

    const response = NextResponse.redirect(
      new URL(destination, request.url),
      303
    );

    setSessionCookies(
      response,
      accessToken,
      newRefreshToken
    );

    response.headers.set(
      "Cache-Control",
      "no-store"
    );

    return response;
  } catch (error) {
    if (
      error instanceof
      RefreshTokenAlreadyRotatedError
    ) {
      authDebug("refresh.concurrent-loser", { destination: redirectTo ?? "/" });
      /*
       * Another request already rotated this refresh
       * token. Do not attempt another rotation.
       *
       * The other request should have already issued
       * the replacement cookies.
       */
      const response = NextResponse.redirect(
        new URL(redirectTo ?? "/", request.url),
        303
      );

      response.headers.set(
        "Cache-Control",
        "no-store"
      );

      response.headers.set(
        "X-Refresh-Rotation",
        "concurrent-request"
      );

      return response;
    }

    if (
      error instanceof InvalidRefreshSessionError ||
      error instanceof ExpiredRefreshSessionError
    ) {
      authDebug("refresh.rejected", { reason: "invalid-or-expired-session" });
      return redirectToLogin(request, true);
    }

    // A database or infrastructure failure is not proof that the browser's
    // credentials are invalid. Do not clear cookies or redirect to login.
    console.error("Refresh failed unexpectedly", error);
    authDebug("refresh.unavailable");
    return NextResponse.json(
      { error: "Authentication service temporarily unavailable" },
      {
        status: 503,
        headers: { "Cache-Control": "no-store" },
      }
    );
  }
}

function isAuthRoute(path: string) {
  return path === "/login" || path === "/register";
}

function homeForRole(role: "ADMIN" | "TEACHER" | "STUDENT") {
  switch (role) {
    case "ADMIN":
      return "/Admin";
    case "TEACHER":
      return "/Teacher";
    case "STUDENT":
      return "/Student";
  }
}

// ---------------------------------------------------------
// SESSION COOKIES
// ---------------------------------------------------------

function setSessionCookies(
  response: NextResponse,
  accessToken: string,
  refreshToken: string
) {
  const isProduction =
    process.env.NODE_ENV === "production";

  response.cookies.set(
    "access_token",
    accessToken,
    {
      httpOnly: true,
      secure: isProduction,
      sameSite: "strict",
      maxAge: 15 * 60,
      path: "/",
    }
  );

  response.cookies.set(
    "refresh_token",
    refreshToken,
    {
      httpOnly: true,
      secure: isProduction,
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60,
      path: "/",
    }
  );
}

// ---------------------------------------------------------
// LOGIN REDIRECT
// ---------------------------------------------------------

function redirectToLogin(
  request: NextRequest,
  clearCookies = true
) {
  const response = NextResponse.redirect(
    new URL("/login", request.url),
    303
  );

  if (clearCookies) {
    response.cookies.set(
      "access_token",
      "",
      {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 0,
        path: "/",
      }
    );

    response.cookies.set(
      "refresh_token",
      "",
      {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 0,
        path: "/",
      }
    );
  }

  response.headers.set(
    "Cache-Control",
    "no-store"
  );

  return response;
}

// ---------------------------------------------------------
// REDIRECT VALIDATION
// ---------------------------------------------------------

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
