import { prisma } from "@/lib/prisma";

export async function findStudentByUserId(
  userId: string
) {
  return prisma.student.findUnique({
    where: {
      userId,
    },
    select: {
      id: true,
    },
  });
}

export async function findTeacherByUserId(
  userId: string
) {
  return prisma.teacher.findUnique({
    where: {
      userId,
    },
    select: {
      id: true,
    },
  });
}

export async function findTeacherAssignments(
  teacherId: string,
  batchIds: string[]
) {
  return prisma.teacherAssignment.findMany({
    where: {
      teacherId,

      ...(batchIds.length > 0
        ? {
            batchId: {
              in: batchIds,
            },
          }
        : {}),
    },

    select: {
      batchId: true,
    },
  });
}

export async function findTeacherSubjects(
  teacherId: string,
  subjectIds: string[]
) {
  return prisma.teacherSubject.findMany({
    where: {
      teacherId,

      ...(subjectIds.length > 0
        ? {
            subjectId: {
              in: subjectIds,
            },
          }
        : {}),
    },

    select: {
      subjectId: true,
    },
  });
}

export async function countStudents(
  where: any
) {
  return prisma.student.count({
    where,
  });
}

export async function findStudents(
  where: any,
  skip: number,
  take: number
) {
  return prisma.student.findMany({
    where,

    select: {
      id: true,
    },

    orderBy: {
      user: {
        name: "asc",
      },
    },

    skip,
    take,
  });
}

export async function findStudentsForReport(
  studentIds: string[],
  subjectIds?: string[]
) {
  return prisma.student.findMany({
    where: {
      id: {
        in: studentIds,
      },
    },

    select: {
      id: true,

      user: {
        select: {
          name: true,
        },
      },

      studentSubjects: {
        where:
          subjectIds &&
          subjectIds.length > 0
            ? {
                subjectId: {
                  in: subjectIds,
                },
              }
            : undefined,

        select: {
          id: true,

          subject: {
            select: {
              id: true,
              name: true,

              parts: {
                select: {
                  id: true,
                  name: true,
                  position: true,
                },

                orderBy: {
                  position: "asc",
                },
              },
            },
          },
        },
      },
    },

    orderBy: {
      user: {
        name: "asc",
      },
    },
  });
}

export async function findTocItems(
  subjectIds: string[]
) {
  return prisma.subjectTocItem.findMany({
    where: {
      subjectId: {
        in: subjectIds,
      },
    },

    select: {
      id: true,
      subjectId: true,
      subjectPartId: true,
      parentId: true,
      name: true,
      position: true,
    },

    orderBy: {
      position: "asc",
    },
  });
}

export async function findTocCompletions(
  studentSubjectIds: string[],
  monthRange?: {
    start: Date;
    end: Date;
  }
) {
  return prisma.tocCompletion.findMany({
    where: {
      studentSubjectId: {
        in: studentSubjectIds,
      },
    },

    select: {
      studentSubjectId: true,

      leafTracks: {
        where: monthRange
          ? {
              completedAt: {
                gte: monthRange.start,
                lt: monthRange.end,
              },
            }
          : undefined,

        select: {
          tocItemId: true,
        },
      },
    },
  });
}