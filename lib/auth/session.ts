import { cache } from "react";
import { cookies } from "next/headers";

import { prisma } from "../prisma";
import { verifyAccessToken } from "./tokens";

// Read-only authentication lookup.
// This function does NOT refresh tokens or mutate cookies.
export const getCurrentUser = cache(async () => {
  const cookieStore = await cookies();

  const accessToken =
    cookieStore.get("access_token")?.value;

  if (!accessToken) {
    return null;
  }

  try {
    const { userId } =
      await verifyAccessToken(accessToken);

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