import { prisma } from "@/lib/prisma";

export function createBranch(name: string) {
  return prisma.branch.create({
    data: {
      name,
    },
  });
}

export function updateBranch(
  branchId: string,
  name: string
) {
  return prisma.branch.update({
    where: {
      id: branchId,
    },
    data: {
      name,
    },
  });
}

export function deleteBranch(branchId: string) {
  return prisma.branch.delete({
    where: {
      id: branchId,
    },
  });
}

export function getBranchesAndBatches() {
  return prisma.branch.findMany({
    select: {
      id: true,
      name: true,

      batches: {
        select: {
          id: true,
          name: true,

          _count: {
            select: {
              students: true,
              teachers: true,
            },
          },
        },
      },
    },
  });
}