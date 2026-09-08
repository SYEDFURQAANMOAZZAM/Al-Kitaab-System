"use server";

import { prisma } from "@/lib/prisma";

type AttendanceStats = {
  present: number;
  absent: number;
  leave: number;
  total: number;
  percentage: number;
};

export async function getOverallAttendance(
  studentId: string
): Promise<AttendanceStats> {
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

    WHERE "userId" = ${studentId};
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
    leave,
    absent,
    total,
    percentage,
  };
}