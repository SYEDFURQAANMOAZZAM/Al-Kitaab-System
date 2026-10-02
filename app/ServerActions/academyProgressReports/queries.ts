import { prisma } from "@/lib/prisma";

import type { GetStudentsMonthProgressInput } from "./types";

function getMonthRange(year: number, month: number) {
  return {
    start: new Date(Date.UTC(year, month - 1, 1)),
    end: new Date(Date.UTC(year, month, 1)),
  };
}

export async function queryStudentsMonthProgress({
  studentIds,
  year,
  month,
}: GetStudentsMonthProgressInput) {
  if (studentIds.length === 0) return [];

  const { start, end } = getMonthRange(year, month);

  return prisma.progress.findMany({
    where: {
      studentId: {
        in: studentIds,
      },
      date: {
        gte: start,
        lt: end,
      },
    },

    orderBy: [
      { studentId: "asc" },
      { date: "asc" },
      { batchname: "asc" },
    ],

    select: {
      id: true,
      studentId: true,
      batchId: true,
      batchname: true,
      date: true,
      remarks: true,
      learnings: true,
      createdAt: true,
      updatedAt: true,
    },
  });
}