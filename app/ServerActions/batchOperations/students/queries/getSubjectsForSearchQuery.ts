
import { prisma } from "@/lib/prisma";
import type { SubjectSearchItem } from "../types";

export async function getSubjectsForSearchQuery(
  studentId: string,
  searchTerm: string
): Promise<SubjectSearchItem[]> {
  const term = searchTerm.trim();

  if (term.length < 3) return [];

  return prisma.subject.findMany({
    where: {
      name: {
        contains: term,
        mode: "insensitive",
      },
      studentSubjects: {
        none: { studentId },
      },
    },
    take: 20,
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
    },
  });
}
