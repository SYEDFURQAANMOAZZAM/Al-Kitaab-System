import { Prisma } from "@/generated/prisma/client";

import {
  findAttendanceForDate,
  findBatch,
  findBatchStudents,
  findBatchTeachers,
  createAttendance,
  incrementStudentAttendanceSummary,
  incrementTeacherAttendanceSummary,
} from "@/app/ServerActions/attendanceOperations/queries/attendance.queries";

import {
  AttendanceInput,
  AttendanceMap,
  SaveAttendanceResult,
} from "@/app/ServerActions/attendanceOperations/types/attendance.types";

import { prisma } from "@/lib/prisma";

function parseDate(dateString: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
    throw new Error("Invalid date.");
  }

  const [year, month, day] = dateString
    .split("-")
    .map(Number);

  const date = new Date(
    Date.UTC(year, month - 1, day)
  );

  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    throw new Error("Invalid date.");
  }

  return date;
}

function formatDate(date: Date) {
  return date.toISOString().slice(0, 10);
}

function toAttendanceMap(
  records: {
    userId: string;
    attended: "PRESENT" | "ABSENT" | "LEAVE";
  }[]
): AttendanceMap {
  return Object.fromEntries(
    records.map((record) => [
      record.userId,
      record.attended,
    ])
  );
}

export async function getAttendanceForDateService(
  batchId: string,
  dateString: string
) {
  if (!batchId) {
    throw new Error("Batch ID is required.");
  }

  const date = parseDate(dateString);

  const existingAttendance =
    await findAttendanceForDate(batchId, date);

  return {
    success: true,
    attendanceTaken:
      existingAttendance.length > 0,
    todayAttendance:
      toAttendanceMap(existingAttendance),
  };
}

export async function saveAttendanceService(
  batchId: string,
  dateString: string,
  attendance: AttendanceInput[]
): Promise<SaveAttendanceResult> {
  if (!batchId) {
    throw new Error("Batch ID is required.");
  }

  if (!dateString) {
    throw new Error(
      "Attendance date is required."
    );
  }

  const date = parseDate(dateString);

  if (!attendance.length) {
    throw new Error(
      "Attendance data is empty."
    );
  }

  const validStatuses = [
    "PRESENT",
    "ABSENT",
    "LEAVE",
  ] as const;

  for (const record of attendance) {
    if (!record.userId) {
      throw new Error(
        "Invalid user in attendance data."
      );
    }

    if (
      !validStatuses.includes(record.attended)
    ) {
      throw new Error(
        "Invalid attendance status."
      );
    }
  }

  const userIds = attendance.map(
    (record) => record.userId
  );

  if (
    new Set(userIds).size !== userIds.length
  ) {
    throw new Error(
      "Duplicate users found in attendance data."
    );
  }

  const batch = await findBatch(batchId);

  if (!batch) {
    throw new Error("Batch not found.");
  }

  const existingAttendance =
    await findAttendanceForDate(
      batchId,
      date
    );

  if (existingAttendance.length > 0) {
    return {
      success: false,
      alreadyTaken: true,
      message: `Attendance for ${formatDate(
        date
      )} has already been taken.`,
      todayAttendance:
        toAttendanceMap(existingAttendance),
    };
  }

  const [
    studentEnrollments,
    teacherAssignments,
  ] = await Promise.all([
    findBatchStudents(batchId, userIds),
    findBatchTeachers(batchId, userIds),
  ]);

  const allowedUserIds = new Set<string>();

  for (const enrollment of studentEnrollments) {
    allowedUserIds.add(
      enrollment.student.userId
    );
  }

  for (const assignment of teacherAssignments) {
    allowedUserIds.add(
      assignment.teacher.userId
    );
  }

  const invalidUserIds = userIds.filter(
    (userId) =>
      !allowedUserIds.has(userId)
  );

  if (invalidUserIds.length > 0) {
    throw new Error(
      "One or more users do not belong to this batch."
    );
  }

  const year = date.getUTCFullYear();
  const month = date.getUTCMonth() + 1;

  try {
    await prisma.$transaction(async (tx) => {
      await createAttendance(
        tx,
        attendance.map((record) => ({
          userId: record.userId,
          attended: record.attended,
          batchId: batch.id,
          batchname: batch.name,
          date,
        }))
      );

      const studentByUserId = new Map(
        studentEnrollments.map((enrollment) => [
          enrollment.student.userId,
          enrollment.studentId,
        ])
      );

      const teacherByUserId = new Map(
        teacherAssignments.map((assignment) => [
          assignment.teacher.userId,
          assignment.teacherId,
        ])
      );

      await Promise.all(
        attendance.map(async (record) => {
          const isPresent =
            record.attended === "PRESENT";

          const studentId =
            studentByUserId.get(record.userId);

          if (studentId) {
            await incrementStudentAttendanceSummary(
              tx,
              studentId,
              batch.id,
              year,
              month,
              isPresent
            );
            return;
          }

          const teacherId =
            teacherByUserId.get(record.userId);

          if (teacherId) {
            await incrementTeacherAttendanceSummary(
              tx,
              teacherId,
              batch.id,
              year,
              month,
              isPresent
            );
          }
        })
      );
    });
  } catch (error: unknown) {
    if (
      error instanceof
        Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      const existingAttendance =
        await findAttendanceForDate(
          batchId,
          date
        );

      return {
        success: false,
        alreadyTaken: true,
        todayAttendance:
          toAttendanceMap(existingAttendance),
        message: `Attendance for ${formatDate(
          date
        )} was already submitted.`,
      };
    }

    throw error;
  }

  return {
    success: true,
    alreadyTaken: false,
    message: `Attendance for ${formatDate(
      date
    )} saved successfully.`,
  };
}