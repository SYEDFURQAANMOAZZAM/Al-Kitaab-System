"use server";

import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth/require-role";

type StoredLearning = {
  pattern?: { id?: string; [key: string]: unknown };
  [key: string]: unknown;
};

export async function getTodayProgress(batchId: string) {
  await requireRole("TEACHER", "ADMIN");

  // Today's date in IST
  const indiaDate = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());

  const today = new Date(`${indiaDate}T00:00:00.000Z`);

  const progress = await prisma.progress.findMany({
    where: {
      batchId,
      date: today,
    },
    select: {
      id: true,
      studentId: true,
      date: true,
      learnings: true,
    },
  });

  // Collect only valid pattern IDs.
  const patternIds = [
    ...new Set(
      progress.flatMap((row) => {
        const learnings = Array.isArray(row.learnings)
          ? (row.learnings as StoredLearning[])
          : [];

        return learnings.flatMap((learning) => {
          const patternId = learning.pattern?.id;

          return patternId ? [patternId] : [];
        });
      })
    ),
  ];

  const patterns = patternIds.length
    ? await prisma.pattern.findMany({
        where: {
          id: {
            in: patternIds,
          },
        },
        select: {
          id: true,
          tocItems: {
            orderBy: {
              position: "asc",
            },
            select: {
              id: true,
              name: true,
              parentId: true,
              patternArrId: true,
              position: true,
            },
          },
        },
      })
    : [];

  const tocByPatternId = new Map(
    patterns.map((pattern) => [pattern.id, pattern.tocItems])
  );

  return progress.map((row) => ({
    ...row,

    learnings: Array.isArray(row.learnings)
      ? (row.learnings as StoredLearning[]).map((learning) => {
          const patternId = learning.pattern?.id;

          // No pattern or no valid pattern ID.
          if (!patternId) {
            return learning;
          }

          return {
            ...learning,
            pattern: {
              ...learning.pattern,
              tocItems: tocByPatternId.get(patternId) ?? [],
            },
          };
        })
      : row.learnings,
  }));
}