
import { prisma } from "@/lib/prisma";
import type { TeacherSearchItem } from "../types";

export async function getTeachersForSearchQuery(
  batchId: string,
  search: string,
): Promise<TeacherSearchItem[]> {
  const term = search.trim();

  if (term.length < 2) return [];

  const teachers = await prisma.teacher.findMany({
    where: {
      assignments: {
        none: { batchId },
      },
      user: {
        role: "TEACHER",
        OR: [
          { name: { contains: term, mode: "insensitive" } },
          { email: { contains: term, mode: "insensitive" } },
          { phone: { contains: term, mode: "insensitive" } },
        ],
      },
    },
    orderBy: {
      user: { name: "asc" },
    },
    take: 20,
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

  return teachers.map((teacher) => ({
    id: teacher.id,
    userId: teacher.userId,
    name: teacher.user.name,
    email: teacher.user.email,
    phone: teacher.user.phone,
  }));
}
