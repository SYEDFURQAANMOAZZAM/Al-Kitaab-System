"use server";

import { requireRole } from "@/lib/auth/require-role";
import { getBatchSubjectsService } from "../services/batchSubjects.service";
import type { GetBatchSubjectsInput } from "../types/progressRelated.types";

export async function getBatchSubjects(
  { batchId }: GetBatchSubjectsInput,
) {
  const user = await requireRole("ADMIN", "TEACHER");

  return getBatchSubjectsService({
    batchId,
    teacherUserId:
      user.role === "TEACHER"
        ? user.id
        : undefined,
  });
}