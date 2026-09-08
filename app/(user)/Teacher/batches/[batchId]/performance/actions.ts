"use server";

import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth/require-role";

function startOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function startOfNextMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth() + 1, 1);
}

function startOfYear(date: Date) {
  return new Date(date.getFullYear(), 0, 1);
}

function startOfNextYear(date: Date) {
  return new Date(date.getFullYear() + 1, 0, 1);
}

function percentage(value: number, total: number) {
  if (total === 0) return 0;

  return Math.round((value / total) * 100);
}

/**
 * Makes sure the currently logged-in teacher is actually assigned
 * to this batch.
 */
async function verifyTeacherBatch(batchId: string) {
  const session = await requireRole("TEACHER");

  const teacher = await prisma.teacher.findUnique({
    where: {
      userId: session.id,
    },
    select: {
      id: true,
    },
  });

  if (!teacher) {
    throw new Error("Teacher not found");
  }

  const assignment = await prisma.teacherAssignment.findUnique({
    where: {
      teacherId_batchId: {
        teacherId: teacher.id,
        batchId,
      },
    },
    select: {
      id: true,
    },
  });

  if (!assignment) {
    throw new Error("You are not assigned to this batch");
  }

  return teacher;
}

export async function getBatchPerformance(batchId: string) {
  await verifyTeacherBatch(batchId);

  const now = new Date();

  const monthStart = startOfMonth(now);
  const nextMonthStart = startOfNextMonth(now);

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
              userId: true,
              user: {
                select: {
                  name: true,
                },
              },
            },
          },
        },
      },

      _count: {
        select: {
          students: true,
          teachers: true,
        },
      },
    },
  });

  if (!batch) {
    throw new Error("Batch not found");
  }

  const studentIds = batch.students.map(
    (enrollment) => enrollment.student.id
  );

  /*
   * Fetch only this batch's attendance.
   *
   * userId is also restricted to students enrolled in this batch.
   */
  const attendance = await prisma.attendance.findMany({
    where: {
      batchId,
      userId: {
        in: studentIds,
      },
      date: {
        gte: monthStart,
        lt: nextMonthStart,
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
  });

  const progress = await prisma.progress.findMany({
    where: {
      batchId,
      studentId: {
        in: studentIds,
      },
      date: {
        gte: monthStart,
        lt: nextMonthStart,
      },
    },
    select: {
      studentId: true,
      date: true,
    },
  });

  /*
   * Day-wise attendance.
   */
  const dayMap = new Map<
    string,
    {
      present: number;
      total: number;
    }
  >();

  for (const record of attendance) {
    const day = record.date.toISOString().slice(0, 10);

    if (!dayMap.has(day)) {
      dayMap.set(day, {
        present: 0,
        total: 0,
      });
    }

    const item = dayMap.get(day)!;

    /*
     * Leave is excluded from attendance percentage.
     */
    if (record.attended !== "LEAVE") {
      item.total++;

      if (record.attended === "PRESENT") {
        item.present++;
      }
    }
  }

  const daywiseAttendance = [...dayMap.entries()].map(
    ([date, value]) => ({
      date,
      attendancePercent: percentage(
        value.present,
        value.total
      ),
    })
  );

  /*
   * Student monthly performance.
   */
  const progressCount = new Map<string, number>();

  for (const record of progress) {
    progressCount.set(
      record.studentId,
      (progressCount.get(record.studentId) ?? 0) + 1
    );
  }

  const studentAttendance = new Map<
    string,
    {
      present: number;
      total: number;
    }
  >();

  for (const record of attendance) {
    if (record.attended === "LEAVE") continue;

    if (!studentAttendance.has(record.userId)) {
      studentAttendance.set(record.userId, {
        present: 0,
        total: 0,
      });
    }

    const item = studentAttendance.get(record.userId)!;

    item.total++;

    if (record.attended === "PRESENT") {
      item.present++;
    }
  }

  const students = batch.students.map(({ student }) => {
    const attendanceData = studentAttendance.get(student.userId) ?? {
      present: 0,
      total: 0,
    };

    const progressTotal = progressCount.get(student.id) ?? 0;

    return {
      id: student.id,
      name: student.user.name,

      attendancePercent: percentage(
        attendanceData.present,
        attendanceData.total
      ),

      /*
       * Progress percentage:
       *
       * progress records / attendance records
       *
       * capped at 100 so bad/duplicate data cannot produce
       * something like 135%.
       */
      progressPercent:
        attendanceData.total === 0
          ? 0
          : Math.min(
              100,
              percentage(
                progressTotal,
                attendanceData.total
              )
            ),
    };
  });

  return {
    batch: {
      id: batch.id,
      name: batch.name,
      studentCount: batch._count.students,
      teacherCount: batch._count.teachers,
    },

    month: {
      year: now.getFullYear(),
      month: now.getMonth() + 1,
      daywiseAttendance,
      students,
    },
  };
}