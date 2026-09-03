"use server";

import { prisma } from "@/lib/prisma";

export type BulkProgressStats = {
  yes: number;
  no: number;
  total: number;
  studyPercentage: number;
  averageScore: number;
  progressPercentage: number;
};

export type BulkProgressMap = Map<
  string,
  BulkProgressStats
>;

type ProgressRow = {
  studentId: string;
  yes: bigint;
  no: bigint;
  total: bigint;
  averageScore: number | null;
};

export async function getProgressForAllStudents(
  months: number | null
): Promise<BulkProgressMap> {
  if (
    months !== null &&
    (!Number.isInteger(months) || months < 1)
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

  let rows: ProgressRow[];

  if (months === null) {
    rows = await prisma.$queryRaw<ProgressRow[]>`
      SELECT
        "studentId",

        COUNT(*) FILTER (
          WHERE "studied" = 'YES'
        ) AS yes,

        COUNT(*) FILTER (
          WHERE "studied" = 'NO'
        ) AS no,

        COUNT(*) AS total,

        AVG("score") AS "averageScore"

      FROM "Progress"

      GROUP BY "studentId";
    `;
  } else {
    const startDate = new Date(
      now.getFullYear(),
      now.getMonth() - (months - 1),
      1
    );

    rows = await prisma.$queryRaw<ProgressRow[]>`
      SELECT
        "studentId",

        COUNT(*) FILTER (
          WHERE "studied" = 'YES'
        ) AS yes,

        COUNT(*) FILTER (
          WHERE "studied" = 'NO'
        ) AS no,

        COUNT(*) AS total,

        AVG("score") AS "averageScore"

      FROM "Progress"

      WHERE
        "date" >= ${startDate}
        AND "date" < ${startOfTomorrow}

      GROUP BY "studentId";
    `;
  }

  const progressMap: BulkProgressMap = new Map();

  for (const row of rows) {
    const yes = Number(row.yes);
    const no = Number(row.no);
    const total = Number(row.total);

    const studyPercentage =
      total === 0
        ? 0
        : (yes / total) * 100;

    const averageScore =
      Number(row.averageScore ?? 0);

    const progressPercentage =
      (studyPercentage + averageScore) / 2;

    progressMap.set(row.studentId, {
      yes,
      no,
      total,
      studyPercentage,
      averageScore,
      progressPercentage,
    });
  }

  return progressMap;
}