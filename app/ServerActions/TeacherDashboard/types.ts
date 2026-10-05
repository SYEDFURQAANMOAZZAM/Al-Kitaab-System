export type TeacherDashboardInput = {
  batchIds: string[];
  month: number;
  year: number;
};

/**
 * Internal server-only input.
 *
 * These values are added after authentication/authorization.
 * They are never supplied by the browser.
 */
export type TeacherDashboardQueryInput =
  TeacherDashboardInput & {
    teacherId: string;
    teacherName: string;
  };

export type TeacherDashboardAttendance = {
  presentDays: number;
  eligibleDays: number;
  percentage: number;
};

export type TeacherDashboardBatch = {
  id: string;
  name: string;

  branch: {
    id: string;
    name: string;
  };

  studentAttendance: TeacherDashboardAttendance;
  teacherAttendance: TeacherDashboardAttendance;

  attendancePercentage: number;
};

export type TeacherDashboardResult = {
  teacherName: string;

  counts: {
    batches: number;
    subjects: number;
    teachers: number;
    students: number;
  };

  batches: TeacherDashboardBatch[];

  averageAttendancePercentage: number;
};