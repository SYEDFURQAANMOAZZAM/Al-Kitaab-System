import type { Progress } from "@/generated/prisma/client";

export type ProgressRecord = Pick<
  Progress,
  | "id"
  | "studentId"
  | "batchId"
  | "batchname"
  | "date"
  | "remarks"
  | "learnings"
  | "createdAt"
  | "updatedAt"
>;

export type GetStudentBatchMonthProgressInput = {
  studentId: string;
  batchId: string;
  year: number;
  month: number; // 1-12
};

export type GetStudentMonthProgressInput = {
  studentId: string;
  year: number;
  month: number; // 1-12
};

export type StudentBatchMonthProgressDay = {
  date: Date;
  progress: ProgressRecord | null;
};

export type StudentMonthProgressDay = {
  date: Date;
  progresses: ProgressRecord[];
};

export type GetBatchStudentsMonthProgressInput = {
  batchId: string;
  year: number;
  month: number; // 1-12
};

export type BatchStudentMonthProgress = {
  student: {
    id: string;
    userId: string;
    name: string;
  };

  days: StudentBatchMonthProgressDay[];
};