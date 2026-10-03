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
      const existingEnrollments =
        await tx.studentEnrollment.findMany({
          where: {
            studentId: student.id,
          },
          select: {
            batchId: true,
          },
        });

      const existingBatchIds = new Set(
        existingEnrollments.map(
          (enrollment) => enrollment.batchId,
        ),
      );

      const submittedBatchIds = new Set(
        effectiveBatchIds,
      );

      // Only create newly added batches
      const batchIdsToCreate =
        effectiveBatchIds.filter(
          (batchId) =>
            !existingBatchIds.has(batchId),
        );

      // Only delete batches removed from the form
      const batchIdsToDelete =
        [...existingBatchIds].filter(
          (batchId) =>
            !submittedBatchIds.has(batchId),
        );

      if (batchIdsToCreate.length > 0) {
        await tx.studentEnrollment.createMany({
          data: batchIdsToCreate.map(
            (batchId) => ({
              studentId: student.id,
              batchId,
            }),
          ),
          skipDuplicates: true,
        });
      }

      if (batchIdsToDelete.length > 0) {
        await tx.studentEnrollment.deleteMany({
          where: {
            studentId: student.id,
            batchId: {
              in: batchIdsToDelete,
            },
          },
        });
      }
    }

    /*
    * Subjects
    */
    if (updateSubjects) {
      const existingStudentSubjects =
        await tx.studentSubject.findMany({
          where: {
            studentId: student.id,
          },
          select: {
            subjectId: true,
          },
        });

      const existingSubjectIds = new Set(
        existingStudentSubjects.map(
          (studentSubject) =>
            studentSubject.subjectId,
        ),
      );

      const submittedSubjectIds = new Set(
        effectiveSubjectIds,
      );

      // Only create newly added subjects
      const subjectIdsToCreate =
        effectiveSubjectIds.filter(
          (subjectId) =>
            !existingSubjectIds.has(subjectId),
        );

      // Only delete subjects removed from the form
      const subjectIdsToDelete =
        [...existingSubjectIds].filter(
          (subjectId) =>
            !submittedSubjectIds.has(subjectId),
        );

      if (subjectIdsToCreate.length > 0) {
        await tx.studentSubject.createMany({
          data: subjectIdsToCreate.map(
            (subjectId) => ({
              studentId: student.id,
              subjectId,
            }),
          ),
          skipDuplicates: true,
        });
      }

      if (subjectIdsToDelete.length > 0) {
        await tx.studentSubject.deleteMany({
          where: {
            studentId: student.id,
            subjectId: {
              in: subjectIdsToDelete,
            },
          },
        });
      }
    }
  });
}