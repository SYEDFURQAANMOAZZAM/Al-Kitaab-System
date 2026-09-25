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
  month,
}: {
  page?: number;
  search?: string;

  /**
   * YYYY-MM
   *
   * undefined = all-time
   */
  month?: string;
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

  // ----------------------------------------------------------
  // Count
  // ----------------------------------------------------------

  const [totalStudents, students] =
  await Promise.all([
    prisma.student.count({
      where,
    }),

    prisma.student.findMany({
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
    }),
  ]);

  const studentIds =
    students.map(
      (student) =>
        student.id,
    );

  // ----------------------------------------------------------
  // Build report
  // ----------------------------------------------------------

  const data =
    await buildTocReport({
      studentIds,

      month:
        month?.trim() || undefined,
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