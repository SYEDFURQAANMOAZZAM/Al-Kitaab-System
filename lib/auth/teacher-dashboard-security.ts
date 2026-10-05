import { requireRole } from "@/lib/auth/require-role";
import { prisma } from "@/lib/prisma";

export async function requireTeacherBatchAccess(
  batchIds: string[],
) {
  const user = await requireRole("TEACHER");

  const teacher = await prisma.teacher.findUnique({
    where: {
      userId: user.id,
    },

    select: {
      id: true,

      assignments: {
        where: {
          batchId: {
            in: batchIds,
          },
        },

        select: {
          batchId: true,
        },
      },
    },
  });

  if (!teacher) {
    throw new Error("Teacher profile not found");
  }

  const authorizedBatchIds = new Set(
    teacher.assignments.map(
      (assignment) => assignment.batchId,
    ),
  );

  const hasAccessToAll = batchIds.every(
    (batchId) =>
      authorizedBatchIds.has(batchId),
  );

  if (!hasAccessToAll) {
    throw new Error("Unauthorized");
  }

  return {
    teacherId: teacher.id,
    user,
  };
}