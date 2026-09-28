import { prisma } from "@/lib/prisma";

import type {
  StudentPerformanceData,
} from "./types";

/* -------------------------------------------------------------------------- */
/* DATE HELPERS                                                               */
/* -------------------------------------------------------------------------- */

function getMonthStart(
  year: number,
  month: number
) {
  return new Date(
    Date.UTC(
      year,
      month - 1,
      1
    )
  );
}

/**
 * Returns the exclusive upper limit for real dates.
 *
 * Past month:
 *   first day of next month
 *
 * Current month:
 *   tomorrow
 *
 * Future month:
 *   null
 */
function getRealDateLimit(
  year: number,
  month: number
): Date | null {
  const now = new Date();

  const currentYear =
    now.getUTCFullYear();

  const currentMonth =
    now.getUTCMonth() + 1;

  /*
   * Future month.
   */
  if (
    year > currentYear ||
    (
      year === currentYear &&
      month > currentMonth
    )
  ) {
    return null;
  }

  /*
   * Current month.
   *
   * Tomorrow is exclusive,
   * therefore today is included.
   */
  if (
    year === currentYear &&
    month === currentMonth
  ) {
    return new Date(
      Date.UTC(
        year,
        month - 1,
        now.getUTCDate() + 1
      )
    );
  }

  /*
   * Past month.
   */
  return new Date(
    Date.UTC(
      year,
      month,
      1
    )
  );
}

/**
 * Generate every real calendar date.
 */
function getRealDates(
  start: Date,
  end: Date
): string[] {
  const dates: string[] = [];

  const current = new Date(
    start
  );

  while (current < end) {
    dates.push(
      current
        .toISOString()
        .slice(0, 10)
    );

    current.setUTCDate(
      current.getUTCDate() + 1
    );
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
  const start =
    getMonthStart(
      year,
      month
    );

  const realDateLimit =
    getRealDateLimit(
      year,
      month
    );

  /* ------------------------------------------------------------------------ */
  /* STUDENT                                                                   */
  /* ------------------------------------------------------------------------ */

  const student =
    await prisma.student.findUnique({
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

        enrollments: {
          select: {
            batch: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    });

  if (!student) {
    throw new Error(
      "Student not found."
    );
  }

  /* ------------------------------------------------------------------------ */
  /* BATCHES                                                                   */
  /* ------------------------------------------------------------------------ */

  const batches =
    student.enrollments
      .map(({ batch }) => ({
        id: batch.id,
        name: batch.name,
      }))
      .sort((a, b) =>
        a.name.localeCompare(
          b.name
        )
      );

  /* ------------------------------------------------------------------------ */
  /* FUTURE MONTH                                                              */
  /* ------------------------------------------------------------------------ */

  /*
   * Future month has no real dates yet.
   */
  if (!realDateLimit) {
    return {
      student: {
        id: student.id,
        name: student.user.name,
      },

      batches,

      attendance: [],
    };
  }

  /* ------------------------------------------------------------------------ */
  /* REAL DATES                                                                */
  /* ------------------------------------------------------------------------ */

  const dates =
    getRealDates(
      start,
      realDateLimit
    );

  const batchIds =
    batches.map(
      (batch) => batch.id
    );

  /* ------------------------------------------------------------------------ */
  /* NO BATCHES                                                                */
  /* ------------------------------------------------------------------------ */

  if (!batchIds.length) {
    return {
      student: {
        id: student.id,
        name: student.user.name,
      },

      batches: [],

      attendance: [],
    };
  }

  /* ------------------------------------------------------------------------ */
  /* ATTENDANCE                                                                */
  /* ------------------------------------------------------------------------ */

  const attendance =
    await prisma.attendance.findMany({
      where: {
        userId: student.userId,

        batchId: {
          in: batchIds,
        },

        date: {
          gte: start,
          lt: realDateLimit,
        },
      },

      select: {
        batchId: true,
        date: true,
        attended: true,
      },

      orderBy: [
        {
          batchId: "asc",
        },

        {
          date: "asc",
        },
      ],
    });

  /* ------------------------------------------------------------------------ */
  /* ATTENDANCE LOOKUP                                                         */
  /* ------------------------------------------------------------------------ */

  const attendanceByBatch =
    new Map<
      string,
      Map<
        string,
        "PRESENT" | "ABSENT" | "LEAVE"
      >
    >();

  for (const record of attendance) {
    const date =
      record.date
        .toISOString()
        .slice(0, 10);

    let batchAttendance =
      attendanceByBatch.get(
        record.batchId
      );

    if (!batchAttendance) {
      batchAttendance =
        new Map();

      attendanceByBatch.set(
        record.batchId,
        batchAttendance
      );
    }

    batchAttendance.set(
      date,
      record.attended
    );
  }

  /* ------------------------------------------------------------------------ */
  /* BUILD ATTENDANCE PER BATCH                                               */
  /* ------------------------------------------------------------------------ */

  const batchAttendance =
    batches.map((batch) => {
      const attendanceMap =
        attendanceByBatch.get(
          batch.id
        ) ?? new Map();

      let presentDays = 0;
      let leaveDays = 0;
      let absentDays = 0;

      /*
       * IMPORTANT:
       *
       * We iterate over EVERY real date.
       *
       * Missing attendance = null
       * which the UI will display as "-".
       */
      const records =
        dates.map((date) => {
          const status =
            attendanceMap.get(
              date
            ) ?? null;

          if (
            status === "PRESENT"
          ) {
            presentDays++;
          }

          if (
            status === "LEAVE"
          ) {
            leaveDays++;
          }

          if (
            status === "ABSENT"
          ) {
            absentDays++;
          }

          return {
            date,
            status,
          };
        });

      return {
        batchId: batch.id,
        batchName: batch.name,

        /*
         * Total real calendar days,
         * NOT number of attendance records.
         */
        totalDays: dates.length,

        presentDays,
        leaveDays,
        absentDays,

        records,
      };
    });

  /* ------------------------------------------------------------------------ */
  /* RESULT                                                                    */
  /* ------------------------------------------------------------------------ */

  return {
    student: {
      id: student.id,
      name: student.user.name,
    },

    batches,

    attendance:
      batchAttendance,
  };
}