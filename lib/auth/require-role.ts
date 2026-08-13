import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { getCurrentUser } from "./session";
import {
  refreshSession,
  RefreshTokenAlreadyRotatedError,
} from "./refresh-session";
import { verifyRefreshToken } from "./tokens";

export type UserRole =
  | "ADMIN"
  | "TEACHER"
  | "STUDENT";

/**
 * Normal authentication/authorization boundary
 * for Server Components, layouts, pages, etc.
 *
 * Does NOT mutate cookies.
 */
export async function requireRole(
  ...allowedRoles: UserRole[]
) {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  if (!allowedRoles.includes(user.role)) {
    redirect(homeForRole(user.role));
  }

  return user;
}

/**
 * Authentication boundary specifically for Server Actions.
 *
 * If the access token has expired, this attempts to
 * refresh the session using the refresh token.
 */
export async function requireRoleForAction(
  ...allowedRoles: UserRole[]
) {
  // First try the existing access token.
  const user = await getCurrentUser();

  if (user) {
    if (!allowedRoles.includes(user.role)) {
      redirect(homeForRole(user.role));
    }

    return user;
  }

  // Access token is missing/expired.
  // Try the refresh token.
  const cookieStore = await cookies();

  const refreshToken =
    cookieStore.get("refresh_token")?.value;

  if (!refreshToken) {
    redirect("/login");
  }

  let refreshedSession: Awaited<ReturnType<typeof refreshSession>>;

  try {
    refreshedSession = await refreshSession(refreshToken);
  } catch (error) {
    /*
     * The refresh token may have already been consumed
     * by another concurrent request.
     *
     * In that situation, don't blindly create another
     * session. The other request owns the rotation.
     */
    if (
      error instanceof
      RefreshTokenAlreadyRotatedError
    ) {
      // A concurrent request won the single-use rotation. Do not expose an
      // internal error or treat this as logout; send the browser to a route
      // where the winning response's replacement cookies can be used.
      const { role } = await verifyRefreshToken(refreshToken);
      redirect(homeForRole(role));
    }

    redirect("/login");
  }

  const {
    accessToken,
    refreshToken: newRefreshToken,
    role,
    userId,
  } = refreshedSession;

  /*
   * Server Actions are allowed to modify cookies.
   */
  setSessionCookies(
    cookieStore,
    accessToken,
    newRefreshToken
  );

  if (!allowedRoles.includes(role)) {
    redirect(homeForRole(role));
  }

  /*
   * Do not depend on the old expired access token.
   * We already know the refreshed session belongs
   * to this user.
   *
   * Fetch the current user so the Server Action
   * receives the same user shape as requireRole().
   */
  const refreshedUser =
    await getUserById(userId);

  if (!refreshedUser) {
    redirect("/login");
  }

  return refreshedUser;
}

// ---------------------------------------------------------
// COOKIE HELPERS
// ---------------------------------------------------------

function setSessionCookies(
  cookieStore: Awaited<ReturnType<typeof cookies>>,
  accessToken: string,
  refreshToken: string
) {
  const isProduction =
    process.env.NODE_ENV === "production";

  cookieStore.set(
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

  cookieStore.set(
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
// USER LOOKUP
// ---------------------------------------------------------

async function getUserById(userId: string) {
  const { prisma } = await import("../prisma");

  return prisma.user.findUnique({
    where: {
      id: userId,
    },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
    },
  });
}

// ---------------------------------------------------------
// ROLE HOME
// ---------------------------------------------------------

export function homeForRole(
  role: UserRole
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
