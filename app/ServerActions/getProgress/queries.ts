import { prisma } from "@/lib/prisma";

import type {
  GetStudentBatchMonthProgressInput,
  GetStudentMonthProgressInput,
  GetBatchStudentsMonthProgressInput
} from "./types";

function getMonthRange(year: number, month: number) {
  const start = new Date(
    Date.UTC(year, month - 1, 1)
  );

  const end = new Date(
    Date.UTC(year, month, 1)
  );

  return { start, end };
}

/**
 * Fetch one student's progress for one batch
 * during the specified month.
 */
export async function queryStudentBatchMonthProgress({
  studentId,
  batchId,
  year,
  month,
}: GetStudentBatchMonthProgressInput) {
  const { start, end } = getMonthRange(year, month);

  return prisma.progress.findMany({
    where: {
      studentId,
      batchId,
      date: {
        gte: start,
        lt: end,
      },
    },

    orderBy: {
      date: "asc",
    },

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

/**
 * Fetch one student's progress from ALL batches
 * during the specified month.
 */
export async function queryStudentMonthProgress({
  studentId,
  year,
  month,
}: GetStudentMonthProgressInput) {
  const { start, end } = getMonthRange(year, month);

  return prisma.progress.findMany({
    where: {
      studentId,
      date: {
        gte: start,
        lt: end,
      },
    },

    orderBy: [
      {
        date: "asc",
      },
      {
        batchname: "asc",
      },
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


export async function queryBatchStudentsMonthProgress({
  batchId,
  year,
  month,
}: GetBatchStudentsMonthProgressInput) {
  const { start, end } = getMonthRange(year, month);

  return prisma.progress.findMany({
    where: {
      batchId,
      date: {
        gte: start,
        lt: end,
      },
    },
    orderBy: {
      date: "asc",
    },
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
      student: {
        select: {
          id: true,
          userId: true,
          user: {
            select: {
              name: true,
            },
          },
        },
      },
    },
  });
}