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

export function createBatch(
  branchId: string,
  name: string
) {
  return prisma.batch.create({
    data: {
      name,
      branchId,
    },
  });
}

export function updateBatch(
  batchId: string,
  name: string
) {
  return prisma.batch.update({
    where: {
      id: batchId,
    },
    data: {
      name,
    },
  });
}

export function deleteBatch(batchId: string) {
  return prisma.batch.delete({
    where: {
      id: batchId,
    },
  });
}