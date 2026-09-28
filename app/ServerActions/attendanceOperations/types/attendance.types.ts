export type AttendanceStatus =
  | "PRESENT"
  | "ABSENT"
  | "LEAVE";

export type AttendanceInput = {
  userId: string;
  attended: AttendanceStatus;
};

export type AttendanceMap =
  Record<string, AttendanceStatus>;

export type GetAttendanceResult = {
  success: boolean;
  attendanceTaken: boolean;
  todayAttendance: AttendanceMap;
};

export type SaveAttendanceResult = {
  success: boolean;
  alreadyTaken: boolean;
  message: string;
  todayAttendance?: AttendanceMap;
};