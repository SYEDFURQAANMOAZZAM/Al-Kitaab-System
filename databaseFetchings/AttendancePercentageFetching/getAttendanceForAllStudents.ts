"use server";

import { prisma } from "@/lib/prisma";

export type BulkAttendanceStats = {
  present: number;
  absent: number;
  total: number;
  percentage: number;
};

export type BulkAttendanceMap = Map<
  string,
  BulkAttendanceStats
>;

type AttendanceRow = {
  userId: string;
  present: bigint;
  absent: bigint;
  total: bigint;
};



export async function getAttendanceForAllStudents(
  months: number | null
): Promise<BulkAttendanceMap> {
  if (
    months !== null &&
    (!Number.isInteger(months) ||
      months < 1)
  ) {
    throw new Error(
      "Months must be a positive integer or null"
    );
  }

  const now = new Date();

  const startOfTomorrow = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate() + 1
  );

  let rows: AttendanceRow[];

  if (months === null) {
    rows = await prisma.$queryRaw<
      AttendanceRow[]
    >`
      SELECT
        "userId",

        COUNT(*) FILTER (
          WHERE "attended" = 'PRESENT'
        ) AS present,

        COUNT(*) FILTER (
          WHERE "attended" = 'ABSENT'
        ) AS absent,

        

        COUNT(*) AS total

      FROM "Attendance"

      GROUP BY "userId";
    `;
  } else {
    const startDate = new Date(
      now.getFullYear(),
      now.getMonth() - (months - 1),
      1
    );

    rows = await prisma.$queryRaw<
      AttendanceRow[]
    >`
      SELECT
        "userId",

        COUNT(*) FILTER (
          WHERE "attended" = 'PRESENT'
        ) AS present,

        COUNT(*) FILTER (
          WHERE "attended" = 'ABSENT'
        ) AS absent,

        

        COUNT(*) AS total

      FROM "Attendance"

      WHERE
        "date" >= ${startDate}
        AND "date" < ${startOfTomorrow}

      GROUP BY "userId";
    `;
  }

  const attendanceMap: BulkAttendanceMap =
    new Map();

  for (const row of rows) {
    const present = Number(row.present);
    const absent = Number(row.absent);
    const total = Number(row.total);

    const percentage =
         total === 0
           ? 0
           : (present / total) * 100;

    attendanceMap.set(row.userId, {
      present,
      absent,
      total,
      percentage,
    });
  }

  return attendanceMap;
}