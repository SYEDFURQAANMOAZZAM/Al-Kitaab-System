
import { prisma } from "@/lib/prisma";
import type { StudentSearchItem } from "../types";

export async function getStudentsForSearchQuery(
  batchId: string,
  searchTerm: string
): Promise<StudentSearchItem[]> {
  const term = searchTerm.trim();

  if (term.length < 3) return [];

  const students = await prisma.student.findMany({
    where: {
      enrollments: {
        none: { batchId },
      },
      user: {
        OR: [
          { name: { contains: term, mode: "insensitive" } },
          { email: { contains: term, mode: "insensitive" } },
          { phone: { contains: term, mode: "insensitive" } },
        ],
      },
    },
    take: 20,
    orderBy: {
      user: { name: "asc" },
    },
    select: {
      id: true,
      userId: true,
      user: {
        select: {
          name: true,
          email: true,
          phone: true,
        },
      },
    },
  });

  return students.map(({ id, userId, user }) => ({
    id,
    userId,
    name: user.name,
    email: user.email,
    phone: user.phone,
  }));
}
