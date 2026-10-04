
"use server";

import { z } from "zod";
import { requireRoleForAction } from "@/lib/auth/require-role";
import { replaceTeacherBatchAssignmentService } from "../services/teacherBatchService";
import type { ActionResult } from "../types";

const Schema = z.object({
  teacherId: z.string().min(1),
  currentBatchId: z.string().min(1),
  newBatchId: z.string().min(1),
}).refine(
  (data) => data.currentBatchId !== data.newBatchId,
  { message: "Choose a different batch." },
);

export async function replaceTeacherBatchAssignment(
  teacherId: string,
  currentBatchId: string,
  newBatchId: string,
): Promise<ActionResult<{
  id: string;
  teacherId: string;
  batchId: string;
}>> {
  try {
    await requireRoleForAction(["ADMIN"]);

    const parsed = Schema.safeParse({
      teacherId,
      currentBatchId,
      newBatchId,
    });

    if (!parsed.success) {
      return {
        success: false,
        error: parsed.error.issues[0]?.message ?? "Invalid assignment.",
      };
    }

    const data = await replaceTeacherBatchAssignmentService(
      parsed.data.teacherId,
      parsed.data.currentBatchId,
      parsed.data.newBatchId,
    );

    return { success: true, data };
  } catch (error) {
    console.error("replaceTeacherBatchAssignment:", error);
    return {
      success: false,
      error: error instanceof Error
        ? error.message
        : "Failed to replace teacher assignment.",
    };
  }
}
