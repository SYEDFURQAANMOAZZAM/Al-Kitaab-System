
"use server";

import { z } from "zod";
import { requireRoleForAction } from "@/lib/auth/require-role";
import { addTeacherToBatchService } from "../services/teacherBatchService";
import type { ActionResult } from "../types";

const Schema = z.object({
  teacherId: z.string().min(1),
  batchId: z.string().min(1),
});

export async function addTeacherToBatch(
  teacherId: string,
  batchId: string,
): Promise<ActionResult<{ teacherId: string; batchId: string }>> {
  try {
    await requireRoleForAction(["ADMIN"]);

    const parsed = Schema.safeParse({ teacherId, batchId });
    if (!parsed.success) {
      return { success: false, error: "Invalid teacher or batch ID." };
    }

    const data = await addTeacherToBatchService(
      parsed.data.teacherId,
      parsed.data.batchId,
    );

    return { success: true, data };
  } catch (error) {
    console.error("addTeacherToBatch:", error);
    return {
      success: false,
      error: error instanceof Error
        ? error.message
        : "Failed to assign teacher to batch.",
    };
  }
}
