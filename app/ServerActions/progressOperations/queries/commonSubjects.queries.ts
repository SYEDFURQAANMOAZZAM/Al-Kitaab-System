import { prisma } from "@/lib/prisma";

export async function findStudentSubjects(
  studentId: string,
) {
  return prisma.studentSubject.findMany({
    where: {
      studentId,
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
  });
}

export async function findBatchSubjectIds(
  batchId: string,
) {
  return prisma.batchSubject.findMany({
    where: {
      batchId,
    },

    select: {
      subjectId: true,
    },
  });
}

export async function findTeacherSubjectIds(
  teacherUserId: string,
) {
  return prisma.teacherSubject.findMany({
    where: {
      teacher: {
        userId: teacherUserId,
      },
    },

    select: {
      subjectId: true,
    },
  });
}