import { prisma } from "@/lib/prisma";

export async function findBatchSubjects(
  batchId: string,
  teacherUserId?: string,
) {
  return prisma.batchSubject.findMany({
    where: {
      batchId,

      ...(teacherUserId
        ? {
            subject: {
              teacherSubjects: {
                some: {
                  teacher: {
                    userId: teacherUserId,
                  },
                },
              },
            },
          }
        : {}),
    },

    select: {
      subject: {
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
        },
      },
    },

    orderBy: {
      subject: {
        name: "asc",
      },
    },
  });
}