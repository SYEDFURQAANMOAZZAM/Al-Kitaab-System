import { prisma } from "@/lib/prisma";

import type {
  StudentUpdateData,
  StudentUserUpdateData,
} from "../types/updateStudent.types";

export async function findStudentForUpdate(userId: string) {
  return prisma.student.findUnique({
    where: {
      userId,
    },
    select: {
      id: true,
      userId: true,
      fatherName: true,
      Adress: true,

      user: {
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          phone2: true,
          role: true,
        },
      },

      enrollments: {
        select: {
          batchId: true,
        },
      },

      studentSubjects: {
        select: {
          subjectId: true,
        },
      },
    },
  });
}

export async function findSelectedBatches(batchIds: string[]) {
  return prisma.batch.findMany({
    where: {
      id: {
        in: batchIds,
      },
    },
    select: {
      id: true,
      subjects: {
        select: {
          subjectId: true,
        },
      },
    },
  });
}

export async function updateStudentRecord(
  studentId: string,
  effectiveBatchIds: string[],
  effectiveSubjectIds: string[],
  updateUserData: StudentUserUpdateData,
  updateStudentData: StudentUpdateData,
  updateBatches: boolean,
  updateSubjects: boolean,
  editorRole: string,
  sessionId: string,
)  {
  return prisma.$transaction(async (tx) => {
    /*
     * Re-check student
     */
    const student = await tx.student.findUnique({
      where: {
        id: studentId,
      },
      select: {
        id: true,
        userId: true,

        user: {
          select: {
            id: true,
            role: true,
          },
        },
      },
    });

    if (
      !student ||
      student.user.role !== "STUDENT"
    ) {
      throw new Error("STUDENT_NOT_FOUND");
    }

    /*
     * Re-check ownership inside transaction
     */
    if (
      editorRole === "STUDENT" &&
      sessionId !== student.user.id
    ) {
      throw new Error("UNAUTHORIZED_STUDENT");
    }

    /*
     * User data
     */
    if (Object.keys(updateUserData).length > 0) {
      await tx.user.update({
        where: {
          id: student.userId,
        },
        data: updateUserData,
      });
    }

    /*
     * Student data
     */
    if (Object.keys(updateStudentData).length > 0) {
      await tx.student.update({
        where: {
          id: student.id,
        },
        data: updateStudentData,
      });
    }

    /*
     * Batches
     */
    if (updateBatches) {
      await tx.studentEnrollment.deleteMany({
        where: {
          studentId: student.id,
        },
      });

      await tx.studentEnrollment.createMany({
        data: effectiveBatchIds.map(
          (batchId) => ({
            studentId: student.id,
            batchId,
          }),
        ),
      });
    }

    /*
     * Subjects
     */
    if (updateSubjects) {
      await tx.studentSubject.deleteMany({
        where: {
          studentId: student.id,
        },
      });

      if (effectiveSubjectIds.length > 0) {
        await tx.studentSubject.createMany({
          data: effectiveSubjectIds.map(
            (subjectId) => ({
              studentId: student.id,
              subjectId,
            }),
          ),
        });
      }
    }
  });
}