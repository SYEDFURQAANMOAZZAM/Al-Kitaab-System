import { prisma } from "@/lib/prisma";

import type {
  CreateStudentRecordInput,
} from "../types/createStudent.types";

export async function findSelectedBatches(
  batchIds: string[],
) {
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

export async function createStudentRecord(
  data: CreateStudentRecordInput,
) {
  return prisma.$transaction(
    async (tx) => {
      const user =
        await tx.user.create({
          data: {
            name: data.name,

            email: data.email,

            phone:
              data.phone,

            phone2:
              data.phone2,

            password:
              data.passwordHash,

            role: "STUDENT",
          },
        });

      const student =
        await tx.student.create({
          data: {
            userId: user.id,

            fatherName:
              data.fatherName,

            Adress:
              data.address,
          },
        });

      await tx.studentEnrollment.createMany({
        data: data.batchIds.map(
          (batchId) => ({
            studentId: student.id,
            batchId,
          }),
        ),
      });

      if (
        data.subjectIds.length > 0
      ) {
        await tx.studentSubject.createMany({
          data: data.subjectIds.map(
            (subjectId) => ({
              studentId: student.id,
              subjectId,
            }),
          ),
        });
      }

      return student;
    },
  );
}