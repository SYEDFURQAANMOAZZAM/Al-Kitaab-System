import { prisma } from "@/lib/prisma";

import type { DashboardPeriod } from "./types";

/**
 * Global counts.
 *
 * All six counts are independent and should be executed in parallel
 * from the service layer.
 */
export function countAdmins() {
  return prisma.user.count({
    where: {
      role: "ADMIN",
    },
  });
}

export function countTeachers() {
  return prisma.user.count({
    where: {
      role: "TEACHER",
    },
  });
}

export function countStudents() {
  return prisma.user.count({
    where: {
      role: "STUDENT",
    },
  });
}

export function countBranches() {
  return prisma.branch.count();
}

export function countBatches() {
  return prisma.batch.count();
}

export function countSubjects() {
  return prisma.subject.count();
}

/**
 * Fetch the branch -> batch hierarchy.
 *
 * Only fields required by the dashboard are selected.
 */
export function getBranchesWithBatches() {
  return prisma.branch.findMany({
    select: {
      id: true,
      name: true,

      batches: {
        select: {
          id: true,
          name: true,
        },

        orderBy: {
          name: "asc",
        },
      },
    },

    orderBy: {
      name: "asc",
    },
  });
}

/**
 * Aggregate student attendance for every batch for the requested month.
 *
 * Instead of fetching every student summary:
 *
 *   studentAttendanceSummary[]
 *
 * we ask PostgreSQL to aggregate:
 *
 *   SUM(presentDays)
 *   SUM(eligibleDays)
 *
 * grouped by batch.
 */
export function getStudentAttendanceByBatch(
  period: DashboardPeriod,
) {
  return prisma.studentAttendanceSummary.groupBy({
    by: ["batchId"],

    where: {
      year: period.year,
      month: period.month,
    },

    _sum: {
      presentDays: true,
      eligibleDays: true,
    },
  });
}

/**
 * Aggregate teacher attendance for every batch for the requested month.
 */
export function getTeacherAttendanceByBatch(
  period: DashboardPeriod,
) {
  return prisma.teacherAttendanceSummary.groupBy({
    by: ["batchId"],

    where: {
      year: period.year,
      month: period.month,
    },

    _sum: {
      presentDays: true,
      eligibleDays: true,
    },
  });
}