
import { prisma } from "@/lib/prisma";
import type { SubjectSearchItem } from "../types";

export async function getSubjectsForSearchQuery(
  batchId: string,
  teacherId: string,
  search: string,
): Promise<{ subjects: SubjectSearchItem[]; batchSubjectCount: number }> {
  const term = search.trim();
  const [batchSubjectCount, subjects] = await Promise.all([
    prisma.batchSubject.count({ where: { batchId } }),
    prisma.subject.findMany({
      where: {
        batches: { some: { batchId } },
        teacherSubjects: { none: { teacherId } },
        ...(term ? { name: { contains: term, mode: "insensitive" as const } } : {}),
      },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
  ]);

  return { subjects, batchSubjectCount };
}
