
"use server";

import { requireRole } from "@/lib/auth/require-role";
import { getBranchesWithBatchesService } from "../services/studentBatchService";
import { getActionError } from "./actionUtils";
import type { ActionResult, BranchWithBatches } from "../types";

export async function getBranchesWithBatches():
  Promise<ActionResult<BranchWithBatches[]>> {
  try {
    await requireRole("ADMIN", "TEACHER");

    const data = await getBranchesWithBatchesService();

    return { success: true, data };
  } catch (error) {
    return {
      success: false,
      error: getActionError(error, "Failed to fetch branches and batches"),
    };
  }
}
