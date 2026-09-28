import { prisma } from "@/lib/prisma";
import { Prisma } from "@/generated/prisma/client";

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

      subject: {
        select: {
          id: true,
          name: true,
        },
      },
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

export async function upsertProgress(
  studentId: string,
  batchId: string,
  batchName: string,
  today: Date,
  storedLearnings: Prisma.InputJsonValue,
) {
  return prisma.progress.upsert({
    where: {
      studentId_date_batchId: {
        studentId,
        batchId,
        date: today,
      },
    },

    create: {
      studentId,
      batchId,
      batchname: batchName,
      date: today,
      learnings: storedLearnings,
    },

    update: {
      batchname: batchName,
      learnings: storedLearnings,
    },
  });
}