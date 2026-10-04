
"use server";

import { z } from "zod";
import { requireRoleForAction } from "@/lib/auth/require-role";
import { addStudentToBatchService } from "../services/studentBatchService";
import { getActionError } from "./actionUtils";
import type { ActionResult } from "../types";

const Schema = z.object({
  studentId: z.string().trim().min(1),
  batchId: z.string().trim().min(1),
});

export async function addStudentToBatch(
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

    await addStudentToBatchService(
      parsed.data.studentId,
      parsed.data.batchId
    );

    return {
      success: true,
      message: "Student added to batch successfully",
    };
  } catch (error) {
    return {
      success: false,
      error: getActionError(error, "Failed to add student to batch"),
    };
  }
}
