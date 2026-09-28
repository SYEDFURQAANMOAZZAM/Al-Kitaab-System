import { prisma } from "@/lib/prisma";

export async function findStudentSubject(
  studentSubjectId: string,
) {
  return prisma.studentSubject.findUnique({
    where: {
      id: studentSubjectId,
    },
    select: {
      id: true,
      subjectId: true,
    },
  });
}

export async function findSubjectTocItems(
  subjectId: string,
) {
  return prisma.subjectTocItem.findMany({
    where: {
      subjectId,
    },
    select: {
      id: true,
      parentId: true,
      position: true,
      subjectPartId: true,
    },
    orderBy: {
      position: "asc",
    },
  });
}

export async function upsertTocCompletion(
  studentSubjectId: string,
) {
  return prisma.tocCompletion.upsert({
    where: {
      studentSubjectId,
    },
    create: {
      studentSubjectId,
    },
    update: {},
    select: {
      id: true,
    },
  });
}

export async function findTodaysTracks(
  tocCompletionId: string,
  today: Date,
) {
  return prisma.tocLeafTrack.findMany({
    where: {
      tocCompletionId,
      completedAt: today,
    },
    select: {
      id: true,
      tocItemId: true,
    },
  });
}

export async function deleteTodaysTracks(
  tocCompletionId: string,
  today: Date,
) {
  return prisma.tocLeafTrack.deleteMany({
    where: {
      tocCompletionId,
      completedAt: today,
    },
  });
}

export async function syncTodaysTracks(
  tocCompletionId: string,
  today: Date,
  leavesToRemove: string[],
  leavesToAdd: string[],
) {
  await prisma.$transaction(
    async (tx) => {
      if (leavesToRemove.length > 0) {
        await tx.tocLeafTrack.deleteMany({
          where: {
            tocCompletionId,
            completedAt: today,
            tocItemId: {
              in: leavesToRemove,
            },
          },
        });
      }

      if (leavesToAdd.length > 0) {
        await tx.tocLeafTrack.createMany({
          data: leavesToAdd.map(
            (tocItemId) => ({
              tocCompletionId,
              tocItemId,
              completedAt: today,
            }),
          ),
          skipDuplicates: true,
        });
      }
    },
  );
}