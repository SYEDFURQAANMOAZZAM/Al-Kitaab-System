import {
  countAdmins,
  countTeachers,
  countStudents,
  countBranches,
  countBatches,
  countSubjects,
  getBranchesWithBatches,
  getStudentAttendanceByBatch,
  getTeacherAttendanceByBatch,
} from "./queries";

import type {
  AttendanceStats,
  DashboardPeriod,
  AdminDashboardBatch,
  AdminDashboardBranch,
  AdminDashboardResult,
} from "./types";

function calculatePercentage(
  presentDays: number,
  eligibleDays: number,
): number {
  if (eligibleDays <= 0) {
    return 0;
  }

  return Number(
    ((presentDays / eligibleDays) * 100).toFixed(2),
  );
}

function createAttendanceStats(
  presentDays: number,
  eligibleDays: number,
): AttendanceStats {
  return {
    presentDays,
    eligibleDays,
    percentage: calculatePercentage(
      presentDays,
      eligibleDays,
    ),
  };
}

export async function getAdminDashboard(
  period: DashboardPeriod,
): Promise<AdminDashboardResult> {
  const [
    admins,
    teachers,
    students,
    branchesCount,
    batchesCount,
    subjectsCount,
    branches,
    studentAttendance,
    teacherAttendance,
  ] = await Promise.all([
    countAdmins(),
    countTeachers(),
    countStudents(),
    countBranches(),
    countBatches(),
    countSubjects(),

    getBranchesWithBatches(),

    getStudentAttendanceByBatch(period),
    getTeacherAttendanceByBatch(period),
  ]);

  /**
   * Convert aggregation results into O(1) lookup maps.
   *
   * This avoids repeatedly searching arrays while building
   * the branch -> batch response.
   */
  const studentAttendanceMap = new Map(
    studentAttendance.map((item) => [
      item.batchId,
      {
        presentDays: item._sum.presentDays ?? 0,
        eligibleDays: item._sum.eligibleDays ?? 0,
      },
    ]),
  );

  const teacherAttendanceMap = new Map(
    teacherAttendance.map((item) => [
      item.batchId,
      {
        presentDays: item._sum.presentDays ?? 0,
        eligibleDays: item._sum.eligibleDays ?? 0,
      },
    ]),
  );

  let attendancePercentageSum = 0;
  let attendanceBatchCount = 0;

  const resultBranches: AdminDashboardBranch[] =
    branches.map((branch) => {
      const resultBatches: AdminDashboardBatch[] =
        branch.batches.map((batch) => {
          const studentData =
            studentAttendanceMap.get(batch.id);

          const teacherData =
            teacherAttendanceMap.get(batch.id);

          const studentAttendance =
            createAttendanceStats(
              studentData?.presentDays ?? 0,
              studentData?.eligibleDays ?? 0,
            );

          const teacherAttendance =
            createAttendanceStats(
              teacherData?.presentDays ?? 0,
              teacherData?.eligibleDays ?? 0,
            );

          /**
           * Batch attendance is the average of:
           *
           *   student attendance %
           *   teacher attendance %
           *
           * If one side has no eligible days, use the side
           * that actually has attendance data.
           */
          const studentHasData =
            studentAttendance.eligibleDays > 0;

          const teacherHasData =
            teacherAttendance.eligibleDays > 0;

          let attendancePercentage = 0;

          if (studentHasData && teacherHasData) {
            attendancePercentage =
              Number(
                (
                  (studentAttendance.percentage +
                    teacherAttendance.percentage) /
                  2
                ).toFixed(2),
              );
          } else if (studentHasData) {
            attendancePercentage =
              studentAttendance.percentage;
          } else if (teacherHasData) {
            attendancePercentage =
              teacherAttendance.percentage;
          }

          if (studentHasData || teacherHasData) {
            attendancePercentageSum +=
              attendancePercentage;

            attendanceBatchCount++;
          }

          return {
            id: batch.id,
            name: batch.name,

            studentAttendance,
            teacherAttendance,

            attendancePercentage,
          };
        });

      return {
        id: branch.id,
        name: branch.name,
        batches: resultBatches,
      };
    });

  const averageAttendancePercentage =
    attendanceBatchCount > 0
      ? Number(
          (
            attendancePercentageSum /
            attendanceBatchCount
          ).toFixed(2),
        )
      : 0;

  return {
    counts: {
      admins,
      teachers,
      students,
      branches: branchesCount,
      batches: batchesCount,
      subjects: subjectsCount,
    },

    branches: resultBranches,

    averageAttendancePercentage,
  };
}