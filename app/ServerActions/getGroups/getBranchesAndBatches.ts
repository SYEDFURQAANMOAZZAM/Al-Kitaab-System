"use server";

import { prisma } from "@/lib/prisma";

export async function getBranchesWithBatches() {
  try {
    const branches = await prisma.branch.findMany({
      orderBy: {
        name: "asc",
      },
      select: {
        id: true,
        name: true,
        batches: {
          orderBy: {
            name: "asc",
          },
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    console.log("getBranchesWithBatches:", branches);

    return branches;
  } catch (error) {
    console.error(
      "getBranchesWithBatches failed:",
      error,
    );

    throw new Error(
      "Failed to load branches.",
    );
  }
}