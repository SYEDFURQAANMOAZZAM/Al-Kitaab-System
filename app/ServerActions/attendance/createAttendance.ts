"use server";

import { prisma } from "@/lib/prisma";
import {
  requireRole,
  requireRoleForAction,
} from "@/lib/auth/require-role";
import { revalidatePath } from "next/dist/server/web/spec-extension/revalidate";

type AttendanceStatus = "PRESENT" | "ABSENT" | "LEAVE";

type AttendanceInput = {
  userId: string;
  attended: AttendanceStatus;
};

type SaveAttendanceResult = {
  success: boolean;
  alreadyTaken: boolean;
  message: string;
};

function getTodayDate() {
  const now = new Date();

  return new Date(
    Date.UTC(
      now.getFullYear(),
      now.getMonth(),
      now.getDate()
    )
  );
}

export async function saveAttendance(
  batchId: string,
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
   * Validate input
   */
  if (!batchId) {
    throw new Error("Batch ID is required.");
  }

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
   * Today's calendar date.
   *
   * Attendance.date is @db.Date,
   * so there is no time component.
   */
  const today = getTodayDate();

  /*
   * Check whether attendance has already
   * been taken for this batch today.
   */
  const existingAttendance =
    await prisma.attendance.findFirst({
      where: {
        batchId,
        date: today,
      },
      select: {
        id: true,
      },
    });
console.log("EXISTING ATTENDANCE:", existingAttendance);
console.log("BATCH:", batchId);
console.log("TODAY:", today);
  if (existingAttendance) {
     console.log("🚨 ATTENDANCE ALREADY TAKEN");
    return {
      success: false,
      alreadyTaken: true,
      message:
        "Attendance for today has been taken already.",
    };
  }

  /*
   * Make sure submitted students belong
   * to this batch.
   */
  const userIds = attendance.map(
    (record) => record.userId
  );

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
  await prisma.attendance.createMany({
  data: attendance.map((record) => ({
    userId: record.userId,
    attended: record.attended,
    batchId: batch.id,
    batchname: batch.name,
    date: today,
  })),
});

const check = await prisma.attendance.findMany({
  where: {
    batchId,
    date: today,
  },
});

console.log("AFTER CREATE:", check);
  revalidatePath(`/Admin/branches/${batchId}/attendance`);
  revalidatePath(`/Teacher/batches/${batchId}/attendance`);
  return {
    success: true,
    alreadyTaken: false,
    message: "Attendance saved successfully.",
  };
}