"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";

import { signAuthToken } from "@/lib/auth/tokens";
import { normalizeEmail } from "@/lib/auth/email";
import { prisma } from "@/lib/prisma";
import { LoginFormSchema } from "./Validate";

type LoginState = {
  error?: string;
};

export async function login(
  prevState: LoginState | undefined,
  formData: FormData
) {
  // -------------------------------------------------------
  // 1. Validate input
  // -------------------------------------------------------

  const parsed = LoginFormSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return {
      error: "Enter a valid email and password.",
    };
  }

  const { password } = parsed.data;
  const email = normalizeEmail(parsed.data.email);

  // -------------------------------------------------------
  // 2. Find user
  // -------------------------------------------------------

  const user = await prisma.user.findUnique({
    where: {
      email,
    },
  });

  if (!user) {
    return {
      error: "Invalid credentials",
    };
  }

  // -------------------------------------------------------
  // 3. Verify password
  // -------------------------------------------------------

  const valid = await bcrypt.compare(
    password,
    user.password
  );

  if (!valid) {
    return {
      error: "Invalid credentials",
    };
  }

  // -------------------------------------------------------
  // 4. Create authentication token
  // -------------------------------------------------------

  const authToken = await signAuthToken(
    user.id,
    user.role
  );

  // -------------------------------------------------------
  // 5. Store authentication cookie
  // -------------------------------------------------------

  const cookieStore = await cookies();

  cookieStore.set("auth_token", authToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 9 * 60 * 60,
    path: "/",
  });

  // -------------------------------------------------------
  // 6. Determine redirect destination
  // -------------------------------------------------------

  const callbackUrl = formData.get("callbackUrl");

  const requestedPath =
    typeof callbackUrl === "string"
      ? getSafeCallbackPath(callbackUrl)
      : null;

  // -------------------------------------------------------
  // 7. Check whether user is authorized for callback
  // -------------------------------------------------------

  if (
    requestedPath &&
    isAuthorizedForPath(user.role, requestedPath)
  ) {
    redirect(requestedPath);
  }

  // -------------------------------------------------------
  // 8. No callback OR unauthorized callback
  // -------------------------------------------------------

  redirect(homeForRole(user.role));
}

// =========================================================
// CALLBACK URL SECURITY
// =========================================================

function getSafeCallbackPath(
  callbackUrl: string
): string | null {
  try {
    // Only allow internal paths.
    const url = new URL(
      callbackUrl,
      "http://localhost"
    );

    if (url.origin !== "http://localhost") {
      return null;
    }

    if (!url.pathname.startsWith("/")) {
      return null;
    }

    // Never allow callback to redirect back to auth pages.
    if (
      url.pathname === "/login" ||
      url.pathname === "/register"
    ) {
      return null;
    }

    return (
      url.pathname +
      url.search +
      url.hash
    );
  } catch {
    return null;
  }
}

// =========================================================
// AUTHORIZATION
// =========================================================

function isAuthorizedForPath(
  role: "ADMIN" | "TEACHER" | "STUDENT",
  pathname: string
) {
  const requiredRole = getRequiredRole(pathname);

  // Public route
  if (!requiredRole) {
    return true;
  }

  return requiredRole === role;
}

// =========================================================
// REQUIRED ROLE
// =========================================================

function getRequiredRole(
  pathname: string
) {
  if (matchesRoute(pathname, "/Admin")) {
    return "ADMIN";
  }

  if (matchesRoute(pathname, "/Teacher")) {
    return "TEACHER";
  }

  if (matchesRoute(pathname, "/Student")) {
    return "STUDENT";
  }

  return undefined;
}

// =========================================================
// ROLE HOME
// =========================================================

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

// =========================================================
// ROUTE MATCH
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
// LOGOUT
// =========================================================

export async function logout() {
  const cookieStore = await cookies();

  cookieStore.set("auth_token", "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 0,
    path: "/",
  });

  redirect("/login");
}