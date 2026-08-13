"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";

import { signAccessToken, signRefreshToken } from "@/lib/auth/tokens";
import { hashRefreshToken } from "@/lib/auth/token-hash";
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
  // 4. Generate tokens
  // -------------------------------------------------------

  const accessToken = await signAccessToken(
    user.id,
    user.role
  );

  const refreshToken = await signRefreshToken(
    user.id,
    user.role
  );

  // -------------------------------------------------------
  // 5. Create a NEW session
  //
  // IMPORTANT:
  // Do NOT delete existing sessions here.
  //
  // This allows:
  // Browser A → Session A
  // Browser B → Session B
  // Browser C → Session C
  // -------------------------------------------------------

  await prisma.session.create({
    data: {
      tokenHash: hashRefreshToken(refreshToken),
      userId: user.id,
      expiresAt: new Date(
        Date.now() + 7 * 24 * 60 * 60 * 1000
      ),
    },
  });

  // -------------------------------------------------------
  // 6. Store authentication cookies
  // -------------------------------------------------------

  const cookieStore = await cookies();

  cookieStore.set("access_token", accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 15 * 60,
    path: "/",
  });

  cookieStore.set("refresh_token", refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 7 * 24 * 60 * 60,
    path: "/",
  });

  // -------------------------------------------------------
  // 7. Redirect based on role
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

  const refreshToken =
    cookieStore.get("refresh_token")?.value;

  // Delete ONLY this browser/device's session.
  if (refreshToken) {
    await prisma.session.deleteMany({
      where: {
        tokenHash: hashRefreshToken(refreshToken),
      },
    });
  }

  // Clear cookies
  cookieStore.set("access_token", "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 0,
    path: "/",
  });

  cookieStore.set("refresh_token", "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 0,
    path: "/",
  });

  redirect("/login");
}
