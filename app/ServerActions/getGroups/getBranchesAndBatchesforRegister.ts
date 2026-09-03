// lib/queries/branches.ts
//
// Shared query used by both the create and edit pages for
// students/teachers. Its return shape is deliberately built
// to match UserForm's `Branch` type exactly:
//
//   Branch  = { id, name, batches: Batch[] }
//   Batch   = { id, name, patterns: BatchPattern[] }
//   BatchPattern = { id, batchId, patternId, pattern: Pattern }
//   Pattern = { id, name }
//
// Adjust the `@/lib/prisma` import to wherever your Prisma
// client singleton actually lives.

import {prisma} from "@/lib/prisma";
import type { Branch } from "@/app/(user)/Admin/students/add/registerComponentStudent";

export async function getBranchesWithBatches(): Promise<Branch[]> {
  const branches = await prisma.branch.findMany({
    orderBy: { name: "asc" },
    include: {
      batches: {
        orderBy: { name: "asc" },
        include: {
          patterns: {
            include: {
              pattern: true,
            },
          },
        },
      },
    },
  });

  return branches;
}