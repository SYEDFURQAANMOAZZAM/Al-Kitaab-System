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

  return Array.from(
    { length: totalDays },
    (_, i) => new Date(Date.UTC(year, month - 1, i + 1)),
  );
}

function dateKey(date: Date) {
  return date.toISOString().slice(0, 10);
}

export async function getBatchesPerformance(
  batchIds: string[],
  year: number,
  month: number,
): Promise<BatchPerformanceData[]> {
  if (
    !Array.isArray(batchIds) ||
    batchIds.some(
      (id) => typeof id !== "string" || !id.trim(),
    ) ||
    !Number.isInteger(year) ||
    year < 1900 ||
    year > 9999 ||
    !Number.isInteger(month) ||
    month < 1 ||
    month > 12
  ) {
    throw new Error("Invalid batch IDs, year, or month.");
  }

  const uniqueBatchIds = [...new Set(batchIds)];

  if (uniqueBatchIds.length === 0) {
    return [];
  }

  const { start, end } = getMonthRange(year, month);
  const days = getMonthDays(year, month);

  const [
    batches,
    attendance,
    studentSummaries,
    teacherSummaries,
  ] = await Promise.all([
    prisma.batch.findMany({
      where: {
        id: {
          in: uniqueBatchIds,
        },
      },
      select: {
        id: true,
        name: true,
        branch: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: [
        {
          branch: {
            name: "asc",
          },
        },
        {
          name: "asc",
        },
      ],
    }),

    prisma.attendance.findMany({
      where: {
        batchId: {
          in: uniqueBatchIds,
        },
        date: {
          gte: start,
          lt: end,
        },
      },
      select: {
        batchId: true,
        userId: true,
        date: true,
        attended: true,
      },
    }),

    prisma.studentAttendanceSummary.findMany({
      where: {
        batchId: {
          in: uniqueBatchIds,
        },
        year,
        month,
      },
      select: {
        batchId: true,
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
        batchId: {
          in: uniqueBatchIds,
        },
        year,
        month,
      },
      select: {
        batchId: true,
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

  const attendanceByBatch = new Map<
    string,
    Map<string, Record<string, AttendanceStatus>>
  >();

  const attendanceDatesByBatch = new Map<
    string,
    Set<string>
  >();

  for (const record of attendance) {
    const key = dateKey(record.date);

    let users = attendanceByBatch.get(record.batchId);

    if (!users) {
      users = new Map();
      attendanceByBatch.set(record.batchId, users);
    }

    let userAttendance = users.get(record.userId);

    if (!userAttendance) {
      userAttendance = {};
      users.set(record.userId, userAttendance);
    }

    userAttendance[key] = record.attended;

    let dates = attendanceDatesByBatch.get(record.batchId);

    if (!dates) {
      dates = new Set();
      attendanceDatesByBatch.set(record.batchId, dates);
    }

    dates.add(key);
  }

  const studentsByBatch = new Map<
    string,
    StudentPerformance[]
  >();

  for (const summary of studentSummaries) {
    const students =
      studentsByBatch.get(summary.batchId) ?? [];

    students.push({
      id: summary.studentId,
      name: summary.student.user.name,
      presentDays: summary.presentDays,
      eligibleDays: summary.eligibleDays,
      attendance:
        attendanceByBatch
          .get(summary.batchId)
          ?.get(summary.student.userId) ?? {},
    });

    studentsByBatch.set(summary.batchId, students);
  }

  const teachersByBatch = new Map<
    string,
    TeacherPerformance[]
  >();

  for (const summary of teacherSummaries) {
    const teachers =
      teachersByBatch.get(summary.batchId) ?? [];

    teachers.push({
      id: summary.teacherId,
      name: summary.teacher.user.name,
      presentDays: summary.presentDays,
      eligibleDays: summary.eligibleDays,
      attendance:
        attendanceByBatch
          .get(summary.batchId)
          ?.get(summary.teacher.userId) ?? {},
    });

    teachersByBatch.set(summary.batchId, teachers);
  }

  return batches.map(
    (batch): BatchPerformanceData => {
      const students =
        studentsByBatch.get(batch.id) ?? [];

      const teachers =
        teachersByBatch.get(batch.id) ?? [];

      const attendanceDates =
        attendanceDatesByBatch.get(batch.id) ??
        new Set<string>();

      return {
        branch: {
          id: batch.branch.id,
          name: batch.branch.name,
        },

        batch: {
          id: batch.id,
          name: batch.name,
        },

        attendanceTaken: days.map((day) => {
          const key = dateKey(day);

          return {
            date: key,
            taken: attendanceDates.has(key),
          };
        }),

        teachers: [...teachers].sort((a, b) =>
          a.name.localeCompare(b.name),
        ),

        students: [...students].sort((a, b) =>
          a.name.localeCompare(b.name),
        ),
      };
    },
  );
}