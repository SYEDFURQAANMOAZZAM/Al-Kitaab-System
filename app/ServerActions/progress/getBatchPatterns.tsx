"use server";

import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth/require-role";

export async function getBatchPatterns(batchId: string) {
  await requireRole("ADMIN", "TEACHER");

  const batchPatterns = await prisma.batchPattern.findMany({
    where: {
      batchId,
    },
    select: {
      pattern: {
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
          tocItems: {
            orderBy: { position: "asc" },
            select: { id: true, name: true, parentId: true, patternArrId: true, position: true },
          },
        },
      },
    },
  });

  return batchPatterns.map((item) => item.pattern);
}
