
import { prisma } from "@/lib/prisma";
import type { SubjectSearchItem } from "../types";

export async function getSubjectsForSearchQuery(
  teacherId: string,
  search: string,
): Promise<SubjectSearchItem[]> {
  const term = search.trim();

  if (term.length < 2) return [];

  return prisma.subject.findMany({
    where: {
      name: {
        contains: term,
        mode: "insensitive",
      },
      teacherSubjects: {
        none: { teacherId },
      },
    },
    orderBy: { name: "asc" },
    take: 20,
    select: {
      id: true,
      name: true,
    },
  });
}
