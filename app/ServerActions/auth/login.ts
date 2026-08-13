"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";

import { signAuthToken } from "@/lib/auth/tokens";
import { normalizeEmail } from "@/lib/auth/email";
import { prisma } from "@/lib/prisma";

import { LoginFormSchema } from "./Validate";


export async function login(
  prevState: { error?: string } | undefined,
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
    maxAge: 30 * 60, // 30 minutes
    path: "/",
  });

  // -------------------------------------------------------
  // 6. Redirect based on role
  // -------------------------------------------------------

  redirect(
    user.role === "ADMIN"
      ? "/Admin"
      : user.role === "TEACHER"
        ? "/Teacher"
        : "/Student"
  );
}

// ---------------------------------------------------------
// LOGOUT
// ---------------------------------------------------------

export async function logout() {
  const cookieStore = await cookies();

  // Clear authentication cookie
  cookieStore.set("auth_token", "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 0,
    path: "/",
  });

  redirect("/login");
}

