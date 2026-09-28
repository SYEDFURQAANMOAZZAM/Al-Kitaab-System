import { prisma } from "@/lib/prisma";

import type {
  ProgressLearningForStorage,
} from "../types/saveGlobalLearnings.types";

export async function saveProgressForStudent(
  studentId: string,
  batchId: string,
  batchName: string,
  today: Date,
  newLearnings: ProgressLearningForStorage[],
) {
  return prisma.$transaction(
    async (tx) => {
      const existingProgress =
        await tx.progress.findUnique({
          where: {
            studentId_date_batchId: {
              studentId,
              batchId,
              date: today,
            },
          },
          select: {
            id: true,
            learnings: true,
          },
        });

      if (!existingProgress) {
        return tx.progress.create({
          data: {
            studentId,
            batchId,
            batchname: batchName,
            date: today,
            learnings: newLearnings,
          },
        });
      }

      const existingLearnings =
        Array.isArray(
          existingProgress.learnings,
        )
          ? existingProgress.learnings
          : [];

      const updatedLearnings = [
        ...existingLearnings,
        ...newLearnings,
      ];

      return tx.progress.update({
        where: {
          id: existingProgress.id,
        },
        data: {
          batchname: batchName,
          learnings: updatedLearnings,
        },
      });
    },
  );
}

export async function findSubjectParts(
  subjectPartIds: string[],
) {
  return prisma.subjectPart.findMany({
    where: {
      id: {
        in: subjectPartIds,
      },
    },
    select: {
      id: true,
      name: true,
    },
  });
}

export async function findTocItems(
  tocItemIds: string[],
) {
  return prisma.subjectTocItem.findMany({
    where: {
      id: {
        in: tocItemIds,
      },
    },
    select: {
      id: true,
      name: true,
    },
  });
}

export async function findStudentSubjects(
  studentId: string,
  subjectIds: string[],
) {
  return prisma.studentSubject.findMany({
    where: {
      studentId,
      subjectId: {
        in: subjectIds,
      },
    },
    select: {
      id: true,
      subjectId: true,
    },
  });
}

export async function findPositionZeroTrackingTerms(
  subjectIds: string[],
) {
  return prisma.subjectTrackingTerm.findMany({
    where: {
      subjectId: {
        in: subjectIds,
      },
      position: 0,
    },
    select: {
      subjectId: true,
      name: true,
      position: true,
    },
  });
}