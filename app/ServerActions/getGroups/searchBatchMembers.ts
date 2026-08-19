"use server";

import { prisma } from "@/lib/prisma";
import { Role } from "@/generated/prisma/enums";

type SearchBatchMembersParams = {
  batchId: string;
  role: Role;
  query: string;
};

export async function searchBatchMembers({
  batchId,
  role,
  query,
}: SearchBatchMembersParams) {
  const search = query.trim();

  // Search only after 4 characters
  if (search.length < 4) {
    return [];
  }

  // STUDENT
  if (role === Role.STUDENT) {
    const students = await prisma.student.findMany({
      where: {
        // Student must not already be enrolled in this batch
        enrollments: {
          none: {
            batchId,
          },
        },

        // Search through the related User
        user: {
          name: {
            contains: search,
            mode: "insensitive",
          },
        },
      },

      select: {
        id: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },

      take: 10,

      orderBy: {
        user: {
          name: "asc",
        },
      },
    });

    return students.map((student) => ({
      id: student.user.id,
      name: student.user.name,
      email: student.user.email,
    }));
  }

  // TEACHER
  if (role === Role.TEACHER) {
    const teachers = await prisma.teacher.findMany({
      where: {
        // Teacher must not already be assigned to this batch
        assignments: {
          none: {
            batchId,
          },
        },

        // Search through the related User
        user: {
          name: {
            contains: search,
            mode: "insensitive",
          },
        },
      },

      select: {
        id: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },

      take: 10,

      orderBy: {
        user: {
          name: "asc",
        },
      },
    });

    return teachers.map((teacher) => ({
      id: teacher.user.id,
      name: teacher.user.name,
      email: teacher.user.email,
    }));
  }

  return [];
}