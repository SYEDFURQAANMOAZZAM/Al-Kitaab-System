import { cache } from "react";
import { cookies } from "next/headers";

import { prisma } from "../prisma";
import { verifyAuthToken } from "./tokens";

/**
 * Read-only authentication lookup.
 *
 * This function:
 * - Does NOT refresh tokens
 * - Does NOT mutate cookies
 * - Does NOT redirect
 * - Returns the current authenticated user or null
 *
 * Safe to call from Server Components, Server Actions,
 * and other read-only contexts.
 */
export const getCurrentUser = cache(async () => {
  const cookieStore = await cookies();

  const authToken =
    cookieStore.get("auth_token")?.value;

  if (!authToken) {
    return null;
  }

  try {
    const { userId } =
      await verifyAuthToken(authToken);

    return await prisma.user.findUnique({
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
  } catch {
    return null;
  }
});