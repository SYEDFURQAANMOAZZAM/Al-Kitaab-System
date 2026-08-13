import { prisma } from "@/lib/prisma";
import { hashRefreshToken } from "@/lib/auth/token-hash";
import {
  verifyRefreshToken,
  signAccessToken,
  signRefreshToken,
} from "@/lib/auth/tokens";

export class RefreshTokenAlreadyRotatedError extends Error {
  constructor() {
    super("Refresh token has already been rotated");
    this.name = "RefreshTokenAlreadyRotatedError";
  }
}

export class InvalidRefreshSessionError extends Error {
  constructor() {
    super("Invalid refresh session");
    this.name = "InvalidRefreshSessionError";
  }
}

export class ExpiredRefreshSessionError extends Error {
  constructor() {
    super("Expired refresh session");
    this.name = "ExpiredRefreshSessionError";
  }
}

export type RefreshedSession = {
  userId: string;
  role: "ADMIN" | "TEACHER" | "STUDENT";
  accessToken: string;
  refreshToken: string;
};

export async function refreshSession(
  refreshToken: string
): Promise<RefreshedSession> {
  let tokenUserId: string;

  try {
    ({ userId: tokenUserId } = await verifyRefreshToken(refreshToken));
  } catch {
    throw new InvalidRefreshSessionError();
  }

  const refreshTokenHash = hashRefreshToken(refreshToken);

  return prisma.$transaction(async (tx) => {
    const now = new Date();
    const session = await tx.session.findUnique({
      where: { tokenHash: refreshTokenHash },
      include: { user: { select: { role: true } } },
    });

    if (!session || session.userId !== tokenUserId) {
      throw new InvalidRefreshSessionError();
    }

    // A known, consumed token is a rotation loser, never an unknown token.
    if (session.rotatedAt) {
      throw new RefreshTokenAlreadyRotatedError();
    }

    if (session.expiresAt <= now) {
      await tx.session.deleteMany({
        where: {
          tokenHash: refreshTokenHash,
          userId: tokenUserId,
          rotatedAt: null,
          expiresAt: { lte: now },
        },
      });
      throw new ExpiredRefreshSessionError();
    }

    const role = session.user.role;
    const accessToken = await signAccessToken(tokenUserId, role);
    const newRefreshToken = await signRefreshToken(tokenUserId, role);
    const newRefreshTokenHash = hashRefreshToken(newRefreshToken);
    const newExpiresAt = new Date(
      now.getTime() + 7 * 24 * 60 * 60 * 1000
    );

    // Only one transaction can turn this active row into a tombstone.
    const consumed = await tx.session.updateMany({
      where: {
        tokenHash: refreshTokenHash,
        userId: tokenUserId,
        rotatedAt: null,
        expiresAt: { gt: now },
      },
      data: { rotatedAt: now },
    });

    if (consumed.count !== 1) {
      // Re-read inside the transaction: a concurrent winner leaves a durable
      // tombstone, including when it committed before this request's lookup.
      const latest = await tx.session.findUnique({
        where: { tokenHash: refreshTokenHash },
        select: { userId: true, expiresAt: true, rotatedAt: true },
      });

      if (latest?.userId === tokenUserId && latest.rotatedAt) {
        throw new RefreshTokenAlreadyRotatedError();
      }

      if (latest?.userId === tokenUserId && latest.expiresAt <= now) {
        throw new ExpiredRefreshSessionError();
      }

      throw new InvalidRefreshSessionError();
    }

    await tx.session.create({
      data: {
        tokenHash: newRefreshTokenHash,
        userId: tokenUserId,
        expiresAt: newExpiresAt,
      },
    });

    return {
      userId: tokenUserId,
      role,
      accessToken,
      refreshToken: newRefreshToken,
    };
  });
}
