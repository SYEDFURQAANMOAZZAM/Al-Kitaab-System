
"use server";

import { requireRole } from "@/lib/auth/require-role";
import { getBranchesWithBatchesService } from "../services/teacherSearchService";
import type { ActionResult, BranchWithBatches } from "../types";

export async function getBranchesWithBatches(): Promise<
  ActionResult<BranchWithBatches[]>
> {
  try {
    await requireRole("ADMIN", "TEACHER");

    const data = await getBranchesWithBatchesService();
    return { success: true, data };
  } catch (error) {
    console.error("getBranchesWithBatches:", error);
    return {
      success: false,
      error: error instanceof Error
        ? error.message
        : "Failed to fetch branches and batches.",
    };
  }
}
