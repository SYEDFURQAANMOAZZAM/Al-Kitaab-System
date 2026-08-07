import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashRefreshToken } from "@/lib/auth/token-hash";

import {
  verifyRefreshToken,
  signAccessToken,
  signRefreshToken,
} from "@/lib/auth/tokens";

export async function GET(request: NextRequest) {
  const refreshToken = request.cookies.get("refresh_token")?.value;
  const requestedRedirectTo = request.nextUrl.searchParams.get("redirectTo");
  const redirectTo = isSafeRelativePath(requestedRedirectTo)
    ? requestedRedirectTo
    : "/Admin";

  if (!refreshToken) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  try {
    // Verify JWT
    const { userId } = await verifyRefreshToken(refreshToken);
    const refreshTokenHash = hashRefreshToken(refreshToken);

    // Check the token hash exists in the database. The raw token is never stored.
    const session = await prisma.session.findUnique({
      where: {
        tokenHash: refreshTokenHash,
      },
      include: {
        user: { select: { role: true } },
      },
    });

    if (
      !session ||
      session.userId !== userId ||
      session.expiresAt < new Date()
    ) {
      if (session) {
        await prisma.session.deleteMany({
          where: {
            tokenHash: refreshTokenHash,
          },
        });
      }

      throw new Error("Refresh token expired");
    }

    // ROTATION STARTS HERE

    // Generate new tokens
    const newAccessToken =
      await signAccessToken(userId, session.user.role);

    const newRefreshToken =
      await signRefreshToken(userId, session.user.role);

    // Atomically consume the old token and persist its replacement. If either
    // operation fails, the transaction rolls back and the old session remains.
    await prisma.$transaction([
      prisma.session.delete({
        where: {
          tokenHash: refreshTokenHash,
        },
      }),
      prisma.session.create({
        data: {
          tokenHash: hashRefreshToken(newRefreshToken),
          userId,
          expiresAt: new Date(
            Date.now() + 7 * 24 * 60 * 60 * 1000
          ),
        },
      }),
    ]);

    // Create response
    const response = NextResponse.redirect(
      new URL(redirectTo, request.url)
    );

    // Set new access token
    response.cookies.set("access_token", newAccessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 15 * 60,
      path: "/",
    });

    // Set new refresh token
    response.cookies.set("refresh_token", newRefreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60,
      path: "/",
    });

    return response;
  } catch {
    const response = NextResponse.redirect(
      new URL("/login", request.url)
    );

    response.cookies.set("access_token", "", { maxAge: 0, path: "/" });
    response.cookies.set("refresh_token", "", {
      maxAge: 0,
      path: "/",
    });

    return response;
  }
}

function isSafeRelativePath(path: string | null): path is string {
  return Boolean(
    path && path.startsWith("/") && !path.startsWith("//") && !path.includes("\\")
  );
}
