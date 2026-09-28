export type AttendanceStatus =
  | "PRESENT"
  | "ABSENT"
  | "LEAVE"
  | null;

export type BatchAttendanceTakenDay = {
  date: string;
  taken: boolean;
};

export type TeacherPerformance = {
  id: string;
  name: string;
  presentDays: number;
  eligibleDays: number;
  attendance: Record<string, AttendanceStatus>;
};

export type StudentPerformance = {
  id: string;
  name: string;
  presentDays: number;
  eligibleDays: number;
  attendance: Record<string, AttendanceStatus>;
};

export type BatchPerformanceData = {
  batch: {
    id: string;
    name: string;
  };

  attendanceTaken: BatchAttendanceTakenDay[];

  teachers: TeacherPerformance[];

  students: StudentPerformance[];
};