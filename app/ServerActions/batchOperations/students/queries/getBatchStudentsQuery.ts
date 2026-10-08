
import { prisma } from "@/lib/prisma";
import type { BatchStudentItem } from "../types";

export async function getBatchStudentsQuery(
  batchId: string
): Promise<BatchStudentItem[]> {
  const enrollments = await prisma.studentEnrollment.findMany({
    where: { batchId },
    orderBy: {
      student: {
        user: {
          name: "asc",
        },
      },
    },
    select: {
      id: true,
      student: {
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
          studentSubjects: {
            where: {
              subject: {
                batches: { some: { batchId } },
              },
            },
            orderBy: {
              subject: {
                name: "asc",
              },
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

  return enrollments.map(({ id, student }) => ({
    enrollmentId: id,
    studentId: student.id,
    userId: student.userId,
    name: student.user.name,
    email: student.user.email,
    phone: student.user.phone,
    subjects: student.studentSubjects.map(({ subject }) => ({
      id: subject.id,
      name: subject.name,
    })),
  }));
}
