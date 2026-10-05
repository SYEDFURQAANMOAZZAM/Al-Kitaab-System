"use server";

import { requireTeacherBatchAccess } from "@/lib/auth/teacher-dashboard-security";

import { getTeacherDashboard } from "./service";

import type {
  TeacherDashboardInput,
  TeacherDashboardResult,
} from "./types";

export async function getTeacherDashboardAction(
  input: TeacherDashboardInput,
): Promise<TeacherDashboardResult> {
  const { batchIds, month, year } = input;

  if (!Array.isArray(batchIds) || batchIds.length === 0) {
    throw new Error("At least one batch is required");
  }

  if (
    !Number.isInteger(month) ||
    month < 1 ||
    month > 12
  ) {
    throw new Error("Invalid month");
  }

  if (
    !Number.isInteger(year) ||
    year < 2000 ||
    year > 2100
  ) {
    throw new Error("Invalid year");
  }

  const uniqueBatchIds = [
    ...new Set(batchIds),
  ];

  /**
   * Authentication + authorization.
   *
   * teacherId and teacherName come from the
   * authenticated server-side user.
   */
  const {
    teacherId,
    user,
  } = await requireTeacherBatchAccess(
    uniqueBatchIds,
  );

  return getTeacherDashboard({
    teacherId,
    teacherName: user.name,
    batchIds: uniqueBatchIds,
    month,
    year,
  });
}