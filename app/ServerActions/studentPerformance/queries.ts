import { prisma } from "@/lib/prisma";

import type {
  StudentPerformanceData,
} from "./types";

/* -------------------------------------------------------------------------- */
/* DATE HELPERS                                                               */
/* -------------------------------------------------------------------------- */

function getMonthStart(year: number, month: number) {
  return new Date(Date.UTC(year, month - 1, 1));
}

function getRealDateLimit(
  year: number,
  month: number
): Date | null {
  const now = new Date();
  const currentYear = now.getUTCFullYear();
  const currentMonth = now.getUTCMonth() + 1;

  // Future month
  if (
    year > currentYear ||
    (year === currentYear && month > currentMonth)
  ) {
    return null;
  }

  // Current month: include today
  if (year === currentYear && month === currentMonth) {
    return new Date(
      Date.UTC(year, month - 1, now.getUTCDate() + 1)
    );
  }

  // Past month
  return new Date(Date.UTC(year, month, 1));
}

function getRealDates(start: Date, end: Date): string[] {
  const dates: string[] = [];
  const current = new Date(start);

  while (current < end) {
    dates.push(current.toISOString().slice(0, 10));
    current.setUTCDate(current.getUTCDate() + 1);
  }

  return dates;
}

/* -------------------------------------------------------------------------- */
/* QUERY                                                                      */
/* -------------------------------------------------------------------------- */

export async function getStudentPerformance(
  studentId: string,
  year: number,
  month: number
): Promise<StudentPerformanceData> {
  const start = getMonthStart(year, month);
  const realDateLimit = getRealDateLimit(year, month);

  /* ------------------------------------------------------------------------ */
  /* STUDENT                                                                   */
  /* ------------------------------------------------------------------------ */

  const student = await prisma.student.findUnique({
    where: {
      id: studentId,
    },
    select: {
      id: true,
      userId: true,
      user: {
        select: {
          name: true,
        },
      },
    },
  });

  if (!student) {
    throw new Error("Student not found.");
  }

  const studentInfo = {
    id: student.id,
    name: student.user.name,
  };

  // No attendance data exists yet for a future month.
  if (!realDateLimit) {
    return {
      student: studentInfo,
      batches: [],
      attendance: [],
    };
  }

  /* ------------------------------------------------------------------------ */
  /* ATTENDANCE                                                                */
  /* ------------------------------------------------------------------------ */

  const attendance = await prisma.attendance.findMany({
    where: {
      userId: student.userId,
      date: {
        gte: start,
        lt: realDateLimit,
      },
    },
    select: {
      batchId: true,
      batchname: true,
      date: true,
      attended: true,
      batch: {
        select: {
          name: true,
        },
      },
    },
    orderBy: [
      { batchId: "asc" },
      { date: "asc" },
    ],
  });

  /* ------------------------------------------------------------------------ */
  /* REAL DATES                                                                */
  /* ------------------------------------------------------------------------ */

  const dates = getRealDates(start, realDateLimit);

  /* ------------------------------------------------------------------------ */
  /* GROUP ATTENDANCE BY BATCH                                                 */
  /* ------------------------------------------------------------------------ */

  const batchMap = new Map<
    string,
    {
      batchId: string;
      batchName: string;
      presentDays: number;
      leaveDays: number;
      absentDays: number;
      records: {
        date: string;
        status: "PRESENT" | "ABSENT" | "LEAVE" | null;
      }[];
    }
  >();

  for (const record of attendance) {
    let batch = batchMap.get(record.batchId);

    if (!batch) {
      batch = {
        batchId: record.batchId,
        batchName:
          record.batchname ?? record.batch.name,
        presentDays: 0,
        leaveDays: 0,
        absentDays: 0,
        records: [],
      };

      batchMap.set(record.batchId, batch);
    }

    const date = record.date.toISOString().slice(0, 10);

    batch.records.push({
      date,
      status: record.attended,
    });

    if (record.attended === "PRESENT") {
      batch.presentDays++;
    } else if (record.attended === "LEAVE") {
      batch.leaveDays++;
    } else if (record.attended === "ABSENT") {
      batch.absentDays++;
    }
  }

  /* ------------------------------------------------------------------------ */
  /* BUILD ATTENDANCE PER BATCH                                                */
  /* ------------------------------------------------------------------------ */

  const batches = Array.from(batchMap.values())
    .sort((a, b) => a.batchName.localeCompare(b.batchName))
    .map((batch) => {
      const attendanceByDate = new Map(
        batch.records.map((record) => [
          record.date,
          record.status,
        ])
      );

      return {
        batchId: batch.batchId,
        batchName: batch.batchName,
        totalDays: dates.length,
        presentDays: batch.presentDays,
        leaveDays: batch.leaveDays,
        absentDays: batch.absentDays,
        records: dates.map((date) => ({
          date,
          status: attendanceByDate.get(date) ?? null,
        })),
      };
    });

  /* ------------------------------------------------------------------------ */
  /* RESULT                                                                    */
  /* ------------------------------------------------------------------------ */

  return {
    student: studentInfo,
    batches: batches.map((batch) => ({
      id: batch.batchId,
      name: batch.batchName,
    })),
    attendance: batches,
  };
}