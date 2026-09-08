"use server";

import { prisma } from "@/lib/prisma";
import { requireRoleForAction } from "@/lib/auth/require-role";

export async function getPatterns() {
  await requireRoleForAction(["ADMIN"]);

  try {
    const patterns = await prisma.pattern.findMany({
      orderBy: {
        name: "asc",
      },
      select: {
        id: true,
        name: true,

        patternArr: {
          orderBy: {
            position: "asc",
          },
          select: {
            id: true,
            name: true,
            position: true,
          },
        },

        _count: {
          select: {
            batches: true,
          },
        },
      },
    });

    return {
      success: true as const,
      patterns,
    };
  } catch (error) {
    console.error("getPatterns error:", error);

    return {
      success: false as const,
      error: "Failed to load study patterns",
    };
  }
}