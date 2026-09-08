"use server";

import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth/require-role";

export async function getCommonPatterns(
  studentId: string,
  batchId: string
) {
  await requireRole("ADMIN", "TEACHER");

  const studentPatterns =
    await prisma.studentPattern.findMany({
      where: {
        studentId,
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

  const batchPatterns =
    await prisma.batchPattern.findMany({
      where: {
        batchId,
      },
      select: {
        patternId: true,
      },
    });

  const batchPatternIds = new Set(
    batchPatterns.map(
      (pattern) => pattern.patternId
    )
  );
   console.log(
  "TOC ITEMS:",
  JSON.stringify(
    studentPatterns.map((item) => ({
      pattern: item.pattern.name,
      tocItems: item.pattern.tocItems,
    })),
    null,
    2
  )
);
  return studentPatterns
    .filter((item) =>
      batchPatternIds.has(item.pattern.id)
    )
    .map((item) => item.pattern);
}
