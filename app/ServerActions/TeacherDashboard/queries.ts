import { prisma } from "@/lib/prisma";

import type { TeacherDashboardInput } from "./types";

/**
 * Count batches assigned to the authenticated teacher.
 *
 * The action has already verified that every batchId belongs
 * to this teacher, but keeping teacherId in the WHERE clause
 * provides defense in depth.
 */
export function countTeacherBatches(
  teacherId: string,
  batchIds: string[],
) {
  return prisma.teacherAssignment.count({
    where: {
      teacherId,

      batchId: {
        in: batchIds,
      },
    },
  });
}

/**
 * Count subjects assigned to the authenticated teacher.
 *
 * This is teacher-wide, not restricted to the selected batches,
 * because the dashboard requirement is "teacherSubjects".
 */
export function countTeacherSubjects(
  teacherId: string,
) {
  return prisma.teacherSubject.count({
    where: {
      teacherId,
    },
  });
}

/**
 * Get unique teachers assigned to the selected batches.
 *
 * Because authorization has already happened, these are only
 * teachers associated with batches the current teacher can see.
 */
export function getTeachersForBatches(
  batchIds: string[],
) {
  return prisma.teacherAssignment.findMany({
    where: {
      batchId: {
        in: batchIds,
      },
    },

    select: {
      teacherId: true,
    },

    distinct: ["teacherId"],
  });
}

/**
 * Get unique students enrolled in the selected batches.
 *
 * A student enrolled in multiple selected batches is counted once.
 */
export function getStudentsForBatches(
  batchIds: string[],
) {
  return prisma.studentEnrollment.findMany({
    where: {
      batchId: {
        in: batchIds,
      },
    },

    select: {
      studentId: true,
    },

    distinct: ["studentId"],
  });
}

/**
 * Fetch only the fields required by the dashboard.
 */
export function getTeacherBatches(
  batchIds: string[],
) {
  return prisma.batch.findMany({
    where: {
      id: {
        in: batchIds,
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

    orderBy: {
      name: "asc",
    },
  });
}

/**
 * Aggregate student attendance at the batch level.
 *
 * PostgreSQL performs:
 *
 * SUM(presentDays)
 * SUM(eligibleDays)
 *
 * grouped by batch.
 *
 * We therefore don't load individual student summaries
 * into Node.js.
 */
export function getStudentAttendanceByBatch(
  input: TeacherDashboardInput,
) {
  return prisma.studentAttendanceSummary.groupBy({
    by: ["batchId"],

    where: {
      batchId: {
        in: input.batchIds,
      },

      year: input.year,
      month: input.month,
    },

    _sum: {
      presentDays: true,
      eligibleDays: true,
    },
  });
}

/**
 * Aggregate teacher attendance at the batch level.
 */
export function getTeacherAttendanceByBatch(
  input: TeacherDashboardInput,
) {
  return prisma.teacherAttendanceSummary.groupBy({
    by: ["batchId"],

    where: {
      batchId: {
        in: input.batchIds,
      },

      year: input.year,
      month: input.month,
    },

    _sum: {
      presentDays: true,
      eligibleDays: true,
    },
  });
}