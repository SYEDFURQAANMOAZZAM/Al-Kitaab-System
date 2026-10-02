import { Prisma } from "@/generated/prisma/client";

export type GetStudentsMonthProgressInput = {
  studentIds: string[];
  year: number;
  month: number;
};

export type StudentMonthProgressDay = {
  date: Date;
  progresses: {
    id: string;
    studentId: string;
    batchId: string;
    batchname: string | null;
    date: Date;
    remarks: string | null;
    learnings: Prisma.JsonValue | null;
    createdAt: Date;
    updatedAt: Date;
  }[];
};

export type StudentsMonthProgress = {
  studentId: string;
  days: StudentMonthProgressDay[];
};