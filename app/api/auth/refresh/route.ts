import { NextRequest, NextResponse } from "next/server";

import {
  refreshSession,
  ExpiredRefreshSessionError,
  InvalidRefreshSessionError,
  RefreshTokenAlreadyRotatedError,
} from "@/lib/auth/refresh-session";

export async function GET(request: NextRequest) {
  const refreshToken =
    request.cookies.get("refresh_token")?.value;

  const requestedRedirectTo =
    request.nextUrl.searchParams.get("redirectTo");

  const redirectTo = isSafeRelativePath(
    requestedRedirectTo
  )
    ? requestedRedirectTo
    : "/Admin";

  if (!refreshToken) {
    return redirectToLogin(request);
  }

  try {
    const {
      accessToken,
      refreshToken: newRefreshToken,
    } = await refreshSession(refreshToken);

    const response = NextResponse.redirect(
      new URL(redirectTo, request.url),
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
      /*
       * Another request already rotated this refresh
       * token. Do not attempt another rotation.
       *
       * The other request should have already issued
       * the replacement cookies.
       */
      const response = NextResponse.redirect(
        new URL(redirectTo, request.url),
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
      return redirectToLogin(request, true);
    }

    // A database or infrastructure failure is not proof that the browser's
    // credentials are invalid. Do not turn a transient fault into logout.
    console.error("Refresh failed unexpectedly", error);
    return redirectToLogin(request, false);
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
