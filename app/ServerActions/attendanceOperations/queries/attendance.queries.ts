import { prisma } from "@/lib/prisma";
import { Prisma } from "@/generated/prisma/client";

export async function findAttendanceForDate(
  batchId: string,
  date: Date
) {
  return prisma.attendance.findMany({
    where: {
      batchId,
      date,
    },
    select: {
      userId: true,
      attended: true,
    },
  });
}

export async function findBatch(batchId: string) {
  return prisma.batch.findUnique({
    where: {
      id: batchId,
    },
    select: {
      id: true,
      name: true,
    },
  });
}

export async function findBatchStudents(
  batchId: string,
  userIds: string[]
) {
  return prisma.studentEnrollment.findMany({
    where: {
      batchId,
      student: {
        userId: {
          in: userIds,
        },
      },
    },
    select: {
      studentId: true,
      student: {
        select: {
          userId: true,
        },
      },
    },
  });
}

export async function findBatchTeachers(
  batchId: string,
  userIds: string[]
) {
  return prisma.teacherAssignment.findMany({
    where: {
      batchId,
      teacher: {
        userId: {
          in: userIds,
        },
      },
    },
    select: {
      teacherId: true,
      teacher: {
        select: {
          userId: true,
        },
      },
    },
  });
}

export async function createAttendance(
  tx: Prisma.TransactionClient,
  data: {
    userId: string;
    attended: "PRESENT" | "ABSENT" | "LEAVE";
    batchId: string;
    batchname?: string;
    date: Date;
  }[]
) {
  return tx.attendance.createMany({
    data,
  });
}

export async function incrementStudentAttendanceSummary(
  tx: Prisma.TransactionClient,
  studentId: string,
  batchId: string,
  year: number,
  month: number,
  isPresent: boolean
) {
  return tx.studentAttendanceSummary.upsert({
    where: {
      studentId_batchId_year_month: {
        studentId,
        batchId,
        year,
        month,
      },
    },
    create: {
      studentId,
      batchId,
      year,
      month,
      eligibleDays: 1,
      presentDays: isPresent ? 1 : 0,
    },
    update: {
      eligibleDays: {
        increment: 1,
      },
      ...(isPresent
        ? {
            presentDays: {
              increment: 1,
            },
          }
        : {}),
    },
  });
}

export async function incrementTeacherAttendanceSummary(
  tx: Prisma.TransactionClient,
  teacherId: string,
  batchId: string,
  year: number,
  month: number,
  isPresent: boolean
) {
  return tx.teacherAttendanceSummary.upsert({
    where: {
      teacherId_batchId_year_month: {
        teacherId,
        batchId,
        year,
        month,
      },
    },
    create: {
      teacherId,
      batchId,
      year,
      month,
      eligibleDays: 1,
      presentDays: isPresent ? 1 : 0,
    },
    update: {
      eligibleDays: {
        increment: 1,
      },
      ...(isPresent
        ? {
            presentDays: {
              increment: 1,
            },
          }
        : {}),
    },
  });
}