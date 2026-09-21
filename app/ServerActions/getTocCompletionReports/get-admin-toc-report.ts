"use server";

import { prisma } from "@/lib/prisma";
import { requireRoleForAction } from "@/lib/auth/require-role";

import {
  buildTocReport,
  type StudentTocReport,
} from "./build-toc-report";

const PAGE_SIZE = 15;

export type PaginatedTocReport = {
  data: StudentTocReport[];

  page: number;
  pageSize: number;

  totalStudents: number;
  totalPages: number;

  hasNextPage: boolean;
  hasPreviousPage: boolean;
};

export async function getAdminTocReport({
  page = 1,
  search = "",
}: {
  page?: number;
  search?: string;
} = {}): Promise<PaginatedTocReport> {
  await requireRoleForAction([
    "ADMIN",
  ]);

  const safePage =
    Math.max(1, page);

  const skip =
    (safePage - 1) *
    PAGE_SIZE;

  const searchValue =
    search.trim();

  const where = searchValue
    ? {
        user: {
          name: {
            contains:
              searchValue,
            mode: "insensitive" as const,
          },
        },
      }
    : undefined;

  // Count
  const totalStudents =
    await prisma.student.count({
      where,
    });

  // Get only 15 students
  const students =
    await prisma.student.findMany({
      where,

      select: {
        id: true,
      },

      orderBy: {
        user: {
          name: "asc",
        },
      },

      skip,
      take: PAGE_SIZE,
    });

  const studentIds =
    students.map(
      (student) => student.id,
    );

  const data =
    await buildTocReport({
      studentIds,
    });

  const totalPages =
    Math.ceil(
      totalStudents /
        PAGE_SIZE,
    );

  return {
    data,

    page: safePage,
    pageSize: PAGE_SIZE,

    totalStudents,
    totalPages,

    hasNextPage:
      safePage < totalPages,

    hasPreviousPage:
      safePage > 1,
  };
}
