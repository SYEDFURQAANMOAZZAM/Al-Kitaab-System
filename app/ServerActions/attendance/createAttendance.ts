"use server";

import { prisma } from "@/lib/prisma";
import {
  requireRole,
  requireRoleForAction,
} from "@/lib/auth/require-role";
import { revalidatePath } from "next/cache";
import { Prisma } from "@/generated/prisma/client";

type AttendanceStatus = "PRESENT" | "ABSENT" | "LEAVE";

type AttendanceInput = {
  userId: string;
  attended: AttendanceStatus;
};

type AttendanceMap = Record<string, AttendanceStatus>;

type GetAttendanceResult = {
  success: boolean;
  attendanceTaken: boolean;
  todayAttendance: AttendanceMap;
};

type SaveAttendanceResult = {
  success: boolean;
  alreadyTaken: boolean;
  message: string;
  todayAttendance?: AttendanceMap;
};

/*
 * Convert YYYY-MM-DD into a DB date.
 *
 * Example:
 * "2026-09-17"
 * ->
 * 2026-09-17T00:00:00.000Z
 */
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

  /*
   * Prevent invalid dates such as:
   * 2026-02-31
   */
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

/* =========================================================
   GET ATTENDANCE FOR SELECTED DATE
========================================================= */

export async function getAttendanceForDate(
  batchId: string,
  dateString: string
): Promise<GetAttendanceResult> {
  await requireRole("TEACHER", "ADMIN");

  await requireRoleForAction(["TEACHER", "ADMIN"]);

  if (!batchId) {
    throw new Error("Batch ID is required.");
  }

  const date = parseDate(dateString);

  const existingAttendance =
    await prisma.attendance.findMany({
      where: {
        batchId,
        date,
      },
      select: {
        userId: true,
        attended: true,
      },
    });

  const todayAttendance = Object.fromEntries(
    existingAttendance.map((record) => [
      record.userId,
      record.attended,
    ])
  );

  return {
    success: true,
    attendanceTaken: existingAttendance.length > 0,
    todayAttendance,
  };
}

/* =========================================================
   SAVE ATTENDANCE
========================================================= */

export async function saveAttendance(
  batchId: string,
  dateString: string,
  attendance: AttendanceInput[]
): Promise<SaveAttendanceResult> {
  /*
   * Authentication
   */
  await requireRole("TEACHER", "ADMIN");

  /*
   * Action-level authorization
   */
  await requireRoleForAction(["TEACHER", "ADMIN"]);

  /*
   * Validate batch ID
   */
  if (!batchId) {
    throw new Error("Batch ID is required.");
  }

  /*
   * Validate date
   */
  if (!dateString) {
    throw new Error("Attendance date is required.");
  }

  const date = parseDate(dateString);

  /*
   * Validate attendance
   */
  if (!attendance.length) {
    throw new Error("Attendance data is empty.");
  }

  const validStatuses: AttendanceStatus[] = [
    "PRESENT",
    "ABSENT",
    "LEAVE",
  ];

  for (const record of attendance) {
    if (!record.userId) {
      throw new Error("Invalid student.");
    }

    if (!validStatuses.includes(record.attended)) {
      throw new Error("Invalid attendance status.");
    }
  }

  /*
   * Prevent duplicate user IDs
   */
  const userIds = attendance.map(
    (record) => record.userId
  );

  const uniqueUserIds = new Set(userIds);

  if (uniqueUserIds.size !== userIds.length) {
    throw new Error(
      "Duplicate students found in attendance data."
    );
  }

  /*
   * Verify batch exists
   */
  const batch = await prisma.batch.findUnique({
    where: {
      id: batchId,
    },
    select: {
      id: true,
      name: true,
    },
  });

  if (!batch) {
    throw new Error("Batch not found.");
  }

  /*
   * Check whether attendance already exists
   * for THIS selected date.
   */
  const existingAttendance =
    await prisma.attendance.findMany({
      where: {
        batchId,
        date,
      },
      select: {
        userId: true,
        attended: true,
      },
    });

  if (existingAttendance.length > 0) {
    const todayAttendance = Object.fromEntries(
      existingAttendance.map((record) => [
        record.userId,
        record.attended,
      ])
    );

    return {
      success: false,
      alreadyTaken: true,
      message: `Attendance for ${formatDate(
        date
      )} has already been taken.`,
      todayAttendance,
    };
  }

  /*
   * Make sure submitted students belong
   * to this batch.
   */
  const enrollments =
    await prisma.studentEnrollment.findMany({
      where: {
        batchId,
        student: {
          userId: {
            in: userIds,
          },
        },
      },
      select: {
        student: {
          select: {
            userId: true,
          },
        },
      },
    });

  const enrolledUserIds = new Set(
    enrollments.map(
      (enrollment) => enrollment.student.userId
    )
  );

  if (enrolledUserIds.size !== userIds.length) {
    throw new Error(
      "One or more students do not belong to this batch."
    );
  }

  /*
   * Create attendance.
   */
  try {
    await prisma.attendance.createMany({
      data: attendance.map((record) => ({
        userId: record.userId,
        attended: record.attended,
        batchId: batch.id,
        batchname: batch.name,
        date,
      })),
    });
  } catch (error: unknown) {
    /*
     * Another request may have created
     * attendance between our check and createMany.
     */
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      const existingAttendance =
        await prisma.attendance.findMany({
          where: {
            batchId,
            date,
          },
          select: {
            userId: true,
            attended: true,
          },
        });

      const todayAttendance = Object.fromEntries(
        existingAttendance.map((record) => [
          record.userId,
          record.attended,
        ])
      );

      return {
        success: false,
        alreadyTaken: true,
        todayAttendance,
        message: `Attendance for ${formatDate(
          date
        )} was already submitted.`,
      };
    }

    throw error;
  }

  revalidatePath(
    `/Admin/branches/${batchId}/attendance`
  );

  revalidatePath(
    `/Teacher/batches/${batchId}/attendance`
  );

  return {
    success: true,
    alreadyTaken: false,
    message: `Attendance for ${formatDate(
      date
    )} saved successfully.`,
  };
}