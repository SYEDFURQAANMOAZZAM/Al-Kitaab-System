
import { prisma } from "@/lib/prisma";
import type { BatchTeacherItem } from "../types";

export async function getBatchTeachersQuery(
  batchId: string,
): Promise<BatchTeacherItem[]> {
  const assignments = await prisma.teacherAssignment.findMany({
    where: { batchId },
    orderBy: {
      teacher: {
        user: {
          name: "asc",
        },
      },
    },
    select: {
      id: true,
      teacherId: true,
      teacher: {
        select: {
          id: true,
          userId: true,
          user: {
            select: {
              name: true,
              email: true,
              phone: true,
            },
          },
          teacherSubjects: {
            where: {
              subject: {
                batches: {
                  some: { batchId },
                },
              },
            },
            orderBy: {
              subject: { name: "asc" },
            },
            select: {
              subject: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
        },
      },
    },
  });

  return assignments.map((assignment) => ({
    assignmentId: assignment.id,
    teacherId: assignment.teacher.id,
    userId: assignment.teacher.userId,
    name: assignment.teacher.user.name,
    email: assignment.teacher.user.email,
    phone: assignment.teacher.user.phone,
    subjects: assignment.teacher.teacherSubjects.map(
      (item) => item.subject,
    ),
  }));
}
