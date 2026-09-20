"use server";

import { prisma } from "@/lib/prisma";
import { requireRoleForAction } from "@/lib/auth/require-role";

export async function getSubjects() {
  await requireRoleForAction(["ADMIN", "TEACHER"]);

  try {
    const subjects = await prisma.subject.findMany({
      orderBy: {
        name: "asc",
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

        batches: {
          select: {
            id: true,
            batchId: true,
            batch: {
              select: {
                id: true,
                name: true,
                branchId: true,
                branch: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
              },
            },
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

        _count: {
          select: {
            batches: true,
            studentSubjects: true,
            teacherSubjects: true,
            tocItems: true,
          },
        },
      },
    });

    return {
      success: true as const,
      subjects,
    };
  } catch (error) {
    console.error("getSubjects error:", error);

    return {
      success: false as const,
      error: "Failed to load subjects",
    };
  }
}
