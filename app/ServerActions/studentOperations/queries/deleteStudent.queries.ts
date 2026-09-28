import { prisma } from "@/lib/prisma";

export async function findStudentUserId(
  studentId: string,
) {
  return prisma.student.findUnique({
    where: {
      id: studentId,
    },
    select: {
      userId: true,
    },
  });
}

export async function deleteStudentUser(
  userId: string,
) {
  return prisma.user.delete({
    where: {
      id: userId,
    },
  });
}