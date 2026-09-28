import { prisma } from "@/lib/prisma";

import type {
  AttendanceStatus,
  BatchPerformanceData,
  StudentPerformance,
  TeacherPerformance,
} from "./types";

function getMonthRange(year: number, month: number) {
  const start = new Date(Date.UTC(year, month - 1, 1));

  const end = new Date(Date.UTC(year, month, 1));

  return {
    start,
    end,
  };
}

function getMonthDays(year: number, month: number) {
  const count = new Date(
    Date.UTC(year, month, 0)
  ).getUTCDate();

  return Array.from({ length: count }, (_, index) => {
    return new Date(
      Date.UTC(year, month - 1, index + 1)
    );
  });
}

function dateKey(date: Date) {
  return date.toISOString().slice(0, 10);
}

export async function getBatchPerformance(
  batchId: string,
  year: number,
  month: number
): Promise<BatchPerformanceData> {
  const { start, end } = getMonthRange(year, month);

  const days = getMonthDays(year, month);

  const batch = await prisma.batch.findUnique({
    where: {
      id: batchId,
    },
    select: {
      id: true,
      name: true,

      students: {
        select: {
          student: {
            select: {
              id: true,
              userId:true,
              user: {
                select: {
                  name: true,
                },
              },
            },
          },
        },
      },

      teachers: {
        select: {
          teacher: {
            select: {
              id: true,
              userId:true,
              user: {
                select: {
                  name: true,
                },
              },
            },
          },
        },
      },
    },
  });

  if (!batch) {
    throw new Error("Batch not found.");
  }

  const [
    attendance,
    studentSummaries,
    teacherSummaries,
  ] = await Promise.all([
    prisma.attendance.findMany({
      where: {
        batchId,
        date: {
          gte: start,
          lt: end,
        },
      },

      select: {
        userId: true,
        date: true,
        attended: true,
      },

      orderBy: {
        date: "asc",
      },
    }),

    prisma.studentAttendanceSummary.findMany({
      where: {
        batchId,
        year,
        month,
      },

      select: {
        studentId: true,
        presentDays: true,
        eligibleDays: true,
      },
    }),

    prisma.teacherAttendanceSummary.findMany({
      where: {
        batchId,
        year,
        month,
      },

      select: {
        teacherId: true,
        presentDays: true,
        eligibleDays: true,
      },
    }),
  ]);

  /*
   * ------------------------------------------------------------
   * ATTENDANCE BY USER + DATE
   * ------------------------------------------------------------
   */

  const attendanceByUser = new Map<
    string,
    Record<string, AttendanceStatus>
  >();

  for (const record of attendance) {
    const key = dateKey(record.date);

    let userAttendance =
      attendanceByUser.get(record.userId);

    if (!userAttendance) {
      userAttendance = {};
      attendanceByUser.set(
        record.userId,
        userAttendance
      );
    }

    userAttendance[key] = record.attended;
  }

  /*
   * ------------------------------------------------------------
   * ATTENDANCE TAKEN
   * ------------------------------------------------------------
   *
   * A date is considered taken when at least one attendance
   * record exists for this batch on that date.
   */

  const attendanceDates = new Set(
  attendance.map((record) =>
    dateKey(record.date)
  )
);

const attendanceTaken = days.map((day) => {
  const key = dateKey(day);

  return {
    date: key,
    taken: attendanceDates.has(key),
  };
});

  /*
   * ------------------------------------------------------------
   * STUDENT SUMMARIES
   * ------------------------------------------------------------
   */

  const studentSummaryMap = new Map(
    studentSummaries.map((summary) => [
      summary.studentId,
      summary,
    ])
  );

  const students: StudentPerformance[] =
    batch.students
      .map(({ student }) => {
        const summary = studentSummaryMap.get(
          student.id
        );

        return {
          id: student.id,
          name: student.user.name,

          presentDays:
            summary?.presentDays ?? 0,

          eligibleDays:
            summary?.eligibleDays ?? 0,

          attendance:
            attendanceByUser.get(student.userId) ??
            {},
        };
      })
      .sort((a, b) =>
        a.name.localeCompare(b.name)
      );

  /*
   * ------------------------------------------------------------
   * TEACHER SUMMARIES
   * ------------------------------------------------------------
   */

  const teacherSummaryMap = new Map(
    teacherSummaries.map((summary) => [
      summary.teacherId,
      summary,
    ])
  );

  const teachers: TeacherPerformance[] =
    batch.teachers
      .map(({ teacher }) => {
        const summary = teacherSummaryMap.get(
          teacher.id
        );

        return {
          id: teacher.id,
          name: teacher.user.name,

          presentDays:
            summary?.presentDays ?? 0,

          eligibleDays:
            summary?.eligibleDays ?? 0,

          attendance:
            attendanceByUser.get(teacher.userId) ??
            {},
        };
      })
      .sort((a, b) =>
        a.name.localeCompare(b.name)
      );

  return {
    batch: {
      id: batch.id,
      name: batch.name,
    },

    attendanceTaken,

    teachers,

    students,
  };
}