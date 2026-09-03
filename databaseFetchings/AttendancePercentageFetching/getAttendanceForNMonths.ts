"use server";

import { prisma } from "@/lib/prisma";

type AttendanceStats = {
  present: number;
  absent: number;
  leave:number;
  total: number;
  percentage: number;
};

export async function getAttendanceForNMonths(
  studentId: string,
  months: number
): Promise<AttendanceStats> {
  if (!Number.isInteger(months) || months < 0) {
    throw new Error("Months must be a non-negative integer");
  }

  const now = new Date();

  // Start of the month N months before the current month
  const startDate = new Date(
    now.getFullYear(),
    now.getMonth() - months,
    1
  );

  // Include today's attendance
  const startOfTomorrow = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate() + 1
  );

  const result = await prisma.$queryRaw<
    {
      present: bigint;
      leave: bigint;
      absent: bigint;
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
      AND "date" < ${startOfTomorrow};
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