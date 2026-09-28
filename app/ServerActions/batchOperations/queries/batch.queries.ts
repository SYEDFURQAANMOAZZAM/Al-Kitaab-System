import { prisma } from "@/lib/prisma";

export function findBranch(branchId: string) {
  return prisma.branch.findUnique({
    where: {
      id: branchId,
    },
    select: {
      id: true,
    },
  });
}

export function findSubjectsByIds(
  subjectIds: string[]
) {
  return prisma.subject.findMany({
    where: {
      id: {
        in: subjectIds,
      },
    },
    select: {
      id: true,
    },
  });
}

export function getAllSubjects() {
  return prisma.subject.findMany({
    select: {
      id: true,
      name: true,
    },
    orderBy: {
      name: "asc",
    },
  });
}

export function getBatchForEdit(
  batchId: string
) {
  return prisma.batch.findUnique({
    where: {
      id: batchId,
    },
    select: {
      id: true,
      name: true,
      branchId: true,
      subjects: {
        select: {
          subject: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        orderBy: {
          subject: {
            name: "asc",
          },
        },
      },
    },
  });
}

export function createBatch(
  branchId: string,
  name: string,
  subjectIds: string[]
) {
  return prisma.$transaction(async (tx) => {
    const batch = await tx.batch.create({
      data: {
        name,
        branchId,
      },
    });

    if (subjectIds.length > 0) {
      await tx.batchSubject.createMany({
        data: subjectIds.map((subjectId) => ({
          batchId: batch.id,
          subjectId,
        })),
      });
    }

    return batch;
  });
}

export function updateBatch(
  batchId: string,
  name: string,
  subjectIds: string[]
) {
  return prisma.$transaction(async (tx) => {
    const batch = await tx.batch.update({
      where: {
        id: batchId,
      },
      data: {
        name,
      },
    });

    await tx.batchSubject.deleteMany({
      where: {
        batchId,
      },
    });

    if (subjectIds.length > 0) {
      await tx.batchSubject.createMany({
        data: subjectIds.map((subjectId) => ({
          batchId,
          subjectId,
        })),
      });
    }

    return batch;
  });
}

export function deleteBatch(batchId: string) {
  return prisma.batch.delete({
    where: {
      id: batchId,
    },
  });
}