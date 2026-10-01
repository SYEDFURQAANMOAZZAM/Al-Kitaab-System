export type TeacherAttendanceStatus =
  | "PRESENT"
  | "ABSENT"
  | "LEAVE"
  | null;

export type TeacherBatch = {
  id: string;
  name: string;
};

export type TeacherAttendanceRecord = {
  date: number;
  batchAttendance: Record<string, TeacherAttendanceStatus>;
};

export type TeacherPerformanceData = {
  teacherId: string;
  teacherName: string;
  batches: TeacherBatch[];
  attendance: TeacherAttendanceRecord[];
  leaves: number;
  presentDays: number;
  absentDays: number;
  totalDays: number;
};

export type TeacherPerformanceProps = {
  data: TeacherPerformanceData;
  month: number;
  year: number;
};