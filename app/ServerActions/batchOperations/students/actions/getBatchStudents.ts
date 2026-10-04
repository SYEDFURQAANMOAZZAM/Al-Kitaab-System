
"use server";

import { z } from "zod";
import { requireRole } from "@/lib/auth/require-role";
import { getBatchStudentsService } from "../services/studentBatchService";
import { getActionError } from "./actionUtils";
import type { ActionResult, BatchStudentItem } from "../types";

const Schema = z.object({
  batchId: z.string().trim().min(1, "Batch ID is required"),
});

export async function getBatchStudents(
  batchId: string
): Promise<ActionResult<BatchStudentItem[]>> {
  try {
    await requireRole("ADMIN", "TEACHER");

    const parsed = Schema.safeParse({ batchId });

    if (!parsed.success) {
      return {
        success: false,
        error: parsed.error.issues[0]?.message ?? "Invalid input",
      };
    }

    const data = await getBatchStudentsService(parsed.data.batchId);

    return { success: true, data };
  } catch (error) {
    return {
      success: false,
      error: getActionError(error, "Failed to fetch batch students"),
    };
  }
}
