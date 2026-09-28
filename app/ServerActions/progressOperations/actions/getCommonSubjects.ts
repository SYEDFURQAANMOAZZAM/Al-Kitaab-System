"use server";

import { requireRole } from "@/lib/auth/require-role";
import { getCommonSubjectsService } from "../services/commonSubjects.service";
import type { GetCommonSubjectsInput } from "../types/progressRelated.types";

export async function getCommonSubjects({
  studentId,
  batchId,
}: GetCommonSubjectsInput) {
  const user = await requireRole("ADMIN", "TEACHER");

  return getCommonSubjectsService({
    studentId,
    batchId,
    teacherUserId:
      user.role === "TEACHER"
        ? user.id
        : undefined,
  });
}