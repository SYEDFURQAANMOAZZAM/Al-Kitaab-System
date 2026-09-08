"use server";

import { prisma } from "@/lib/prisma";

type AttendanceStats = {
  present: number;
  absent: number;
  leave: number;
  total: number;
  percentage: number;
};

export async function getMonthlyAttendance(
  studentId: string,
  year: number,
  month: number
): Promise<AttendanceStats> {
  if (!Number.isInteger(year)) {
    throw new Error("Invalid year");
  }

  if (!Number.isInteger(month) || month < 1 || month > 12) {
    throw new Error("Month must be between 1 and 12");
  }

  // JavaScript months are 0-based
  const startDate = new Date(year, month - 1, 1);

  // First day of the next month
  const endDate = new Date(year, month, 1);

  const result = await prisma.$queryRaw<
    {
      present: bigint;
      absent: bigint;
      leave: bigint;
      total: bigint;
    }[]
  >`
    SELECT
      COUNT(*) FILTER (
        WHERE "attended" = 'PRESENT'
      ) AS present,

      COUNT(*) FILTER (
        WHERE "attended" = 'LEAVE'
      ) AS leave,

      COUNT(*) FILTER (
        WHERE "attended" = 'ABSENT'
      ) AS absent,

      COUNT(*) AS total

    FROM "Attendance"

    WHERE "userId" = ${studentId}
      AND "date" >= ${startDate}
      AND "date" < ${endDate};
  `;

  const present = Number(result[0]?.present ?? 0);
  const leave = Number(result[0]?.leave ?? 0);
  const absent = Number(result[0]?.absent ?? 0);
  const total = Number(result[0]?.total ?? 0);

  const percentage =
    total === 0
      ? 0
      : Number(((present / total) * 100).toFixed(2));

  return {
    present,
    absent,
    leave,
    total,
    percentage,
  };
}