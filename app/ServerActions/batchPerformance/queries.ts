import { prisma } from "@/lib/prisma";
import type {
  AttendanceStatus,
  BatchPerformanceData,
  StudentPerformance,
  TeacherPerformance,
} from "./types";

function getMonthRange(year: number, month: number) {
  return {
    start: new Date(Date.UTC(year, month - 1, 1)),
    end: new Date(Date.UTC(year, month, 1)),
  };
}

function getMonthDays(year: number, month: number) {
  const totalDays = new Date(Date.UTC(year, month, 0)).getUTCDate();

  return Array.from({ length: totalDays }, (_, i) =>
    new Date(Date.UTC(year, month - 1, i + 1))
  );
}

function dateKey(date: Date) {
  return date.toISOString().slice(0, 10);
}

export async function getBatchPerformance(
  batchId: string,
  year: number,
  month: number
): Promise<BatchPerformanceData> {
  // Input validation
  if (
    typeof batchId !== "string" ||
    !batchId.trim() ||
    !Number.isInteger(year) ||
    year < 1900 ||
    year > 9999 ||
    !Number.isInteger(month) ||
    month < 1 ||
    month > 12
  ) {
    throw new Error("Invalid batch, year, or month.");
  }

  const { start, end } = getMonthRange(year, month);
  const days = getMonthDays(year, month);

  // Independent database queries run concurrently.
  const [batch, attendance, studentSummaries, teacherSummaries] =
    await Promise.all([
      prisma.batch.findUnique({
        where: { id: batchId },
        select: {
          id: true,
          name: true,
        },
      }),

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
          student: {
            select: {
              userId: true,
              user: {
                select: {
                  name: true,
                },
              },
            },
          },
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
          teacher: {
            select: {
              userId: true,
              user: {
                select: {
                  name: true,
                },
              },
            },
          },
        },
      }),
    ]);

  if (!batch) {
    throw new Error("Batch not found.");
  }

  // Build attendance lookup once, rather than repeatedly scanning records.
  const attendanceByUser = new Map<
    string,
    Record<string, AttendanceStatus>
  >();

  const attendanceDates = new Set<string>();

  for (const record of attendance) {
    const key = dateKey(record.date);

    let userAttendance = attendanceByUser.get(record.userId);

    if (!userAttendance) {
      userAttendance = {};
      attendanceByUser.set(record.userId, userAttendance);
    }

    userAttendance[key] = record.attended;
    attendanceDates.add(key);
  }

  const attendanceTaken = days.map((day) => {
    const key = dateKey(day);

    return {
      date: key,
      taken: attendanceDates.has(key),
    };
  });

  const students: StudentPerformance[] = studentSummaries
    .map((summary) => ({
      id: summary.studentId,
      name: summary.student.user.name,
      presentDays: summary.presentDays,
      eligibleDays: summary.eligibleDays,
      attendance:
        attendanceByUser.get(summary.student.userId) ?? {},
    }))
    .sort((a, b) => a.name.localeCompare(b.name));

  const teachers: TeacherPerformance[] = teacherSummaries
    .map((summary) => ({
      id: summary.teacherId,
      name: summary.teacher.user.name,
      presentDays: summary.presentDays,
      eligibleDays: summary.eligibleDays,
      attendance:
        attendanceByUser.get(summary.teacher.userId) ?? {},
    }))
    .sort((a, b) => a.name.localeCompare(b.name));

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


export async function getLiveBatchPerformance(
  batchId: string,
  year: number,
  month: number
): Promise<BatchPerformanceData> {
  // Input validation
  if (
    typeof batchId !== "string" ||
    !batchId.trim() ||
    !Number.isInteger(year) ||
    year < 1900 ||
    year > 9999 ||
    !Number.isInteger(month) ||
    month < 1 ||
    month > 12
  ) {
    throw new Error("Invalid batch, year, or month.");
  }

  const { start, end } = getMonthRange(year, month);
  const days = getMonthDays(year, month);

  // Fetch batch members and attendance concurrently.
  const [batch, attendance] = await Promise.all([
    prisma.batch.findUnique({
      where: { id: batchId },
      select: {
        id: true,
        name: true,

        // Get currently enrolled students.
        students: {
          select: {
            student: {
              select: {
                id: true,
                userId: true,
                user: {
                  select: {
                    name: true,
                  },
                },
                attendanceSummaries: {
                  where: {
                    batchId,
                    year,
                    month,
                  },
                  select: {
                    presentDays: true,
                    eligibleDays: true,
                  },
                },
              },
            },
          },
        },

        // Get currently assigned teachers.
        teachers: {
          select: {
            teacher: {
              select: {
                id: true,
                userId: true,
                user: {
                  select: {
                    name: true,
                  },
                },
                attendanceSummaries: {
                  where: {
                    batchId,
                    year,
                    month,
                  },
                  select: {
                    presentDays: true,
                    eligibleDays: true,
                  },
                },
              },
            },
          },
        },
      },
    }),

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
    }),
  ]);

  if (!batch) {
    throw new Error("Batch not found.");
  }

  // Create attendance lookup.
  const attendanceByUser = new Map<
    string,
    Record<string, AttendanceStatus>
  >();

  const attendanceDates = new Set<string>();

  for (const record of attendance) {
    const key = dateKey(record.date);

    let userAttendance = attendanceByUser.get(record.userId);

    if (!userAttendance) {
      userAttendance = {};
      attendanceByUser.set(record.userId, userAttendance);
    }

    userAttendance[key] = record.attended;
    attendanceDates.add(key);
  }

  // Attendance taken for each day of the month.
  const attendanceTaken = days.map((day) => {
    const key = dateKey(day);

    return {
      date: key,
      taken: attendanceDates.has(key),
    };
  });

  // Build performance for currently enrolled students.
  const students: StudentPerformance[] = batch.students
    .map(({ student }) => {
      const summary = student.attendanceSummaries[0];

      return {
        id: student.id,
        name: student.user.name,
        presentDays: summary?.presentDays ?? 0,
        eligibleDays: summary?.eligibleDays ?? 0,
        attendance: attendanceByUser.get(student.userId) ?? {},
      };
    })
    .sort((a, b) => a.name.localeCompare(b.name));

  // Build performance for currently assigned teachers.
  const teachers: TeacherPerformance[] = batch.teachers
    .map(({ teacher }) => {
      const summary = teacher.attendanceSummaries[0];

      return {
        id: teacher.id,
        name: teacher.user.name,
        presentDays: summary?.presentDays ?? 0,
        eligibleDays: summary?.eligibleDays ?? 0,
        attendance: attendanceByUser.get(teacher.userId) ?? {},
      };
    })
    .sort((a, b) => a.name.localeCompare(b.name));

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
