"use server";

import { requireRole } from "@/lib/auth/require-role";
import { getTodayProgressService } from "../services/getTodayProgress.service";

export async function getTodayProgress(
  batchId: string,
) {
  await requireRole("TEACHER", "ADMIN");

  return getTodayProgressService(batchId);
}