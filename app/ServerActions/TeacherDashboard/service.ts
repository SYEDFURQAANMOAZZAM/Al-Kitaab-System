import {
  countTeacherBatches,
  countTeacherSubjects,
  getTeachersForBatches,
  getStudentsForBatches,
  getTeacherBatches,
  getStudentAttendanceByBatch,
  getTeacherAttendanceByBatch,
} from "./queries";

import type {
  TeacherDashboardQueryInput,
  TeacherDashboardResult,
  TeacherDashboardAttendance,
  TeacherDashboardBatch,
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

function createAttendance(
  presentDays: number,
  eligibleDays: number,
): TeacherDashboardAttendance {
  return {
    presentDays,
    eligibleDays,
    percentage: calculatePercentage(
      presentDays,
      eligibleDays,
    ),
  };
}

function calculateBatchAttendance(
  studentAttendance: TeacherDashboardAttendance,
  teacherAttendance: TeacherDashboardAttendance,
): number {
  const hasStudentData =
    studentAttendance.eligibleDays > 0;

  const hasTeacherData =
    teacherAttendance.eligibleDays > 0;

  if (hasStudentData && hasTeacherData) {
    return Number(
      (
        (studentAttendance.percentage +
          teacherAttendance.percentage) /
        2
      ).toFixed(2),
    );
  }

  if (hasStudentData) {
    return studentAttendance.percentage;
  }

  if (hasTeacherData) {
    return teacherAttendance.percentage;
  }

  return 0;
}

export async function getTeacherDashboard(
  input: TeacherDashboardQueryInput,
): Promise<TeacherDashboardResult> {
  const {
    teacherId,
    teacherName,
    batchIds,
    month,
    year,
  } = input;

  if (batchIds.length === 0) {
    return {
      teacherName,

      counts: {
        batches: 0,
        subjects: 0,
        teachers: 0,
        students: 0,
      },

      batches: [],

      averageAttendancePercentage: 0,
    };
  }

  const [
    batchesCount,
    subjectsCount,
    teachers,
    students,
    batches,
    studentAttendance,
    teacherAttendance,
  ] = await Promise.all([
    countTeacherBatches(
      teacherId,
      batchIds,
    ),

    countTeacherSubjects(
      teacherId,
    ),

    getTeachersForBatches(
      batchIds,
    ),

    getStudentsForBatches(
      batchIds,
    ),

    getTeacherBatches(
      batchIds,
    ),

    getStudentAttendanceByBatch({
      batchIds,
      month,
      year,
    }),

    getTeacherAttendanceByBatch({
      batchIds,
      month,
      year,
    }),
  ]);

  const studentAttendanceMap = new Map(
    studentAttendance.map((item) => [
      item.batchId,
      {
        presentDays:
          item._sum.presentDays ?? 0,

        eligibleDays:
          item._sum.eligibleDays ?? 0,
      },
    ]),
  );

  const teacherAttendanceMap = new Map(
    teacherAttendance.map((item) => [
      item.batchId,
      {
        presentDays:
          item._sum.presentDays ?? 0,

        eligibleDays:
          item._sum.eligibleDays ?? 0,
      },
    ]),
  );

  let attendanceSum = 0;
  let attendanceCount = 0;

  const resultBatches: TeacherDashboardBatch[] =
    batches.map((batch) => {
      const studentData =
        studentAttendanceMap.get(batch.id);

      const teacherData =
        teacherAttendanceMap.get(batch.id);

      const studentAttendanceStats =
        createAttendance(
          studentData?.presentDays ?? 0,
          studentData?.eligibleDays ?? 0,
        );

      const teacherAttendanceStats =
        createAttendance(
          teacherData?.presentDays ?? 0,
          teacherData?.eligibleDays ?? 0,
        );

      const attendancePercentage =
        calculateBatchAttendance(
          studentAttendanceStats,
          teacherAttendanceStats,
        );

      const hasAttendanceData =
        studentAttendanceStats.eligibleDays > 0 ||
        teacherAttendanceStats.eligibleDays > 0;

      if (hasAttendanceData) {
        attendanceSum += attendancePercentage;
        attendanceCount++;
      }

      return {
        id: batch.id,
        name: batch.name,

        branch: batch.branch,

        studentAttendance:
          studentAttendanceStats,

        teacherAttendance:
          teacherAttendanceStats,

        attendancePercentage,
      };
    });

  const averageAttendancePercentage =
    attendanceCount > 0
      ? Number(
          (
            attendanceSum /
            attendanceCount
          ).toFixed(2),
        )
      : 0;

  return {
    teacherName,

    counts: {
      batches: batchesCount,
      subjects: subjectsCount,
      teachers: teachers.length,
      students: students.length,
    },

    batches: resultBatches,

    averageAttendancePercentage,
  };
}