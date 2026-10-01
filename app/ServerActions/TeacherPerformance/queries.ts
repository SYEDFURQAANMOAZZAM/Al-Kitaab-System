import { prisma } from "@/lib/prisma";

import type {
  TeacherPerformanceData,
  TeacherAttendanceRecord,
} from "./types";

function getIndiaToday() {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "numeric",
    day: "numeric",
  }).formatToParts(new Date());

  return {
    year: Number(parts.find((part) => part.type === "year")?.value),
    month: Number(parts.find((part) => part.type === "month")?.value),
    day: Number(parts.find((part) => part.type === "day")?.value),
  };
}

function emptyPerformance(
  teacherId: string
): TeacherPerformanceData {
  return {
    teacherId,
    teacherName: "Teacher",
    batches: [],
    attendance: [],
    leaves: 0,
    presentDays: 0,
    absentDays: 0,
    totalDays: 0,
  };
}

export async function getTeacherPerformance(
  teacherId: string,
  month: number,
  year: number
): Promise<TeacherPerformanceData> {
  if (
    !Number.isInteger(month) ||
    month < 1 ||
    month > 12 ||
    !Number.isInteger(year)
  ) {
    throw new Error("Invalid month or year");
  }

  const teacher = await prisma.teacher.findUnique({
    where: {
      id: teacherId,
    },
    select: {
      id: true,
      userId: true,
      user: {
        select: {
          name: true,
        },
      },
      assignments: {
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

  // If the teacher has been deleted, return an empty result.
  if (!teacher) {
    return emptyPerformance(teacherId);
  }

  const batches = teacher.assignments.map(
    (assignment) => assignment.batch
  );

  const batchIds = batches.map((batch) => batch.id);

  const startDate = new Date(Date.UTC(year, month - 1, 1));
  const monthEnd = new Date(Date.UTC(year, month, 1));

  const today = getIndiaToday();

  const isFutureMonth =
    year > today.year ||
    (year === today.year && month > today.month);

  const isCurrentMonth =
    year === today.year && month === today.month;

  // Exclude future dates, using Hyderabad's current date.
  const endDate = isFutureMonth
    ? startDate
    : isCurrentMonth
      ? new Date(Date.UTC(today.year, today.month - 1, today.day + 1))
      : monthEnd;

  let attendanceRows: {
    date: Date;
    batchId: string;
    attended: "PRESENT" | "ABSENT" | "LEAVE";
  }[] = [];

  if (batchIds.length > 0 && endDate > startDate) {
    attendanceRows = await prisma.attendance.findMany({
      where: {
        userId: teacher.userId,
        batchId: {
          in: batchIds,
        },
        date: {
          gte: startDate,
          lt: endDate,
        },
      },
      select: {
        date: true,
        batchId: true,
        attended: true,
      },
      orderBy: {
        date: "asc",
      },
    });
  }

  const attendanceByDate = new Map<
    number,
    TeacherAttendanceRecord
  >();

  let presentDays = 0;
  let absentDays = 0;
  let leaves = 0;

  for (const record of attendanceRows) {
    const day = record.date.getUTCDate();

    let dayRecord = attendanceByDate.get(day);

    if (!dayRecord) {
      dayRecord = {
        date: day,
        batchAttendance: {},
      };

      attendanceByDate.set(day, dayRecord);
    }

    dayRecord.batchAttendance[record.batchId] = record.attended;

    switch (record.attended) {
      case "PRESENT":
        presentDays++;
        break;

      case "ABSENT":
        absentDays++;
        break;

      case "LEAVE":
        leaves++;
        break;
    }
  }

  return {
    teacherId: teacher.id,
    teacherName: teacher.user.name,
    batches,
    attendance: Array.from(attendanceByDate.values()),
    presentDays,
    absentDays,
    leaves,
    totalDays: attendanceRows.length,
  };
}