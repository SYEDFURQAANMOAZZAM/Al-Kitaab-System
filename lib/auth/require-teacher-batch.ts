import { notFound } from "next/navigation";

import { requireRole } from "@/lib/auth/require-role";
import { prisma } from "@/lib/prisma";

export async function requireTeacherBatchAccess(
  batchId: string,
) {
  const user = await requireRole("TEACHER");

  const teacher = await prisma.teacher.findUnique({
    where: {
      userId: user.id,
    },
    select: {
      assignments: {
        select: {
          batch: {
            select: {
              id: true,
            },
          },
        },
      },
    },
  });

  const hasAccess =
    teacher?.assignments.some(
      (assignment) => assignment.batch.id === batchId,
    ) ?? false;

  if (!hasAccess) {
    notFound();
  }

  return user;
}