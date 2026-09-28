export type StudentAttendanceRecord = {
  date: string;

  status:
    | "PRESENT"
    | "ABSENT"
    | "LEAVE"
    | null;
};

export type StudentBatchAttendance = {
  batchId: string;
  batchName: string;

  totalDays: number;
  presentDays: number;
  leaveDays: number;
  absentDays: number;

  records: StudentAttendanceRecord[];
};

export type StudentPerformanceData = {
  student: {
    id: string;
    name: string;
  };

  batches: {
    id: string;
    name: string;
  }[];

  attendance: StudentBatchAttendance[];
};