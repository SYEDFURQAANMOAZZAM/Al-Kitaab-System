import { prisma } from "@/lib/prisma";

export async function findTodayProgress(
  batchId: string,
  today: Date,
) {
  return prisma.progress.findMany({
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
}

export async function findSubjectsByIds(
  subjectIds: string[],
) {
  return prisma.subject.findMany({
    where: {
      id: {
        in: subjectIds,
      },
    },

    select: {
      id: true,
      name: true,

      parts: {
        orderBy: {
          position: "asc",
        },

        select: {
          id: true,
          name: true,
          position: true,
        },
      },

      trackingTerms: {
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
        orderBy: {
          position: "asc",
        },

        select: {
          id: true,
          name: true,
          parentId: true,
          subjectPartId: true,
          position: true,
        },
      },
    },
  });
}