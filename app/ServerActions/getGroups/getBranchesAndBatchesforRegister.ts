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
"use server";
import { prisma } from "@/lib/prisma";

export type Branch = {
  id: string;
  name: string;
  batches: Array<{
    id: string;
    name: string;
    branchId: string;
    subjects: Array<{
      id: string;
      batchId: string;
      subjectId: string;
      subject: { id: string; name: string };
    }>;
  }>;
};

export async function getBranchesWithBatches(): Promise<Branch[]> {
  const branches = await prisma.branch.findMany({
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      batches: {
        orderBy: { name: "asc" },
        select: {
          id: true,
          name: true,
          branchId: true,
          subjects: {
            select: {
              id: true,
              batchId: true,
              subjectId: true,
              subject: {
                select: { id: true, name: true },
              },
            },
          },
        },
      },
    },
  });

  return branches;
}