export type DashboardPeriod = {
  month: number;
  year: number;
};

export type AttendanceStats = {
  presentDays: number;
  eligibleDays: number;
  percentage: number;
};

export type AdminDashboardBatch = {
  id: string;
  name: string;

  studentAttendance: AttendanceStats;
  teacherAttendance: AttendanceStats;

  // Average of student + teacher attendance
  attendancePercentage: number;
};

export type AdminDashboardBranch = {
  id: string;
  name: string;
  batches: AdminDashboardBatch[];
};

export type AdminDashboardResult = {
  counts: {
    admins: number;
    teachers: number;
    students: number;
    branches: number;
    batches: number;
    subjects: number;
  };

  branches: AdminDashboardBranch[];

  // Average of batch attendance percentages
  averageAttendancePercentage: number;
};

export type GetAdminDashboardInput = DashboardPeriod;