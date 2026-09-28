"use server";

import { revalidatePath } from "next/cache";

import {
  requireRole,
  requireRoleForAction,
} from "@/lib/auth/require-role";

import {
  getAttendanceForDateService,
  saveAttendanceService,
} from "@/app/ServerActions/attendanceOperations/services/attendance.service";

import {
  AttendanceInput,
  GetAttendanceResult,
  SaveAttendanceResult,
} from "@/app/ServerActions/attendanceOperations/types/attendance.types";

export async function getAttendanceForDate(
  batchId: string,
  dateString: string
): Promise<GetAttendanceResult> {
  await requireRole("TEACHER", "ADMIN");

  await requireRoleForAction([
    "TEACHER",
    "ADMIN",
  ]);

  return getAttendanceForDateService(
    batchId,
    dateString
  );
}

export async function saveAttendance(
  batchId: string,
  dateString: string,
  attendance: AttendanceInput[]
): Promise<SaveAttendanceResult> {
  await requireRole("TEACHER", "ADMIN");

  await requireRoleForAction([
    "TEACHER",
    "ADMIN",
  ]);

  const result =
    await saveAttendanceService(
      batchId,
      dateString,
      attendance
    );

  if (result.success) {
    revalidatePath(
      `/admin/branches/${batchId}/attendance`
    );

    revalidatePath(
      `/teacher/batches/${batchId}/attendance`
    );
  }

  return result;
}