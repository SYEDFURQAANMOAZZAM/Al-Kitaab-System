
"use server";

import { z } from "zod";
import { requireRoleForAction } from "@/lib/auth/require-role";
import { removeStudentFromBatchService } from "../services/studentBatchService";
import { getActionError } from "./actionUtils";
import type { ActionResult } from "../types";

const Schema = z.object({
  studentId: z.string().trim().min(1),
  batchId: z.string().trim().min(1),
});

export async function removeStudentFromBatch(
  studentId: string,
  batchId: string
): Promise<ActionResult> {
  try {
    await requireRoleForAction(["ADMIN", "TEACHER"]);

    const parsed = Schema.safeParse({ studentId, batchId });

    if (!parsed.success) {
      return {
        success: false,
        error: parsed.error.issues[0]?.message ?? "Invalid input",
      };
    }

    await removeStudentFromBatchService(
      parsed.data.studentId,
      parsed.data.batchId
    );

    return {
      success: true,
      message: "Student removed from batch successfully",
    };
  } catch (error) {
    return {
      success: false,
      error: getActionError(error, "Failed to remove student from batch"),
    };
  }
}
