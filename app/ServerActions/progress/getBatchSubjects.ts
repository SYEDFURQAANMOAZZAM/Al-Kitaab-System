"use server";

import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth/require-role";

export async function getBatchSubjects(batchId: string) {
  const user = await requireRole("ADMIN", "TEACHER");

  const subjects = await prisma.batchSubject.findMany({
    where: {
      batchId,

      ...(user.role === "TEACHER"
        ? {
            subject: {
              teacherSubjects: {
                some: {
                  teacher: {
                    userId: user.id,
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

  return subjects.map((item) => item.subject);
}