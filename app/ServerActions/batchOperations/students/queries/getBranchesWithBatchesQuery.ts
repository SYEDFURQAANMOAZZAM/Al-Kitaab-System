
import { prisma } from "@/lib/prisma";
import type { BranchWithBatches } from "../types";

export async function getBranchesWithBatchesQuery():
  Promise<BranchWithBatches[]> {
  return prisma.branch.findMany({
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      batches: {
        orderBy: { name: "asc" },
        select: {
          id: true,
          name: true,
        },
      },
    },
  });
}
