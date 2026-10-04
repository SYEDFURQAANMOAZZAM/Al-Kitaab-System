
"use server";

import { z } from "zod";
import { requireRoleForAction } from "@/lib/auth/require-role";
import { replaceStudentBatchEnrollmentService } from "../services/studentBatchService";
import { getActionError } from "./actionUtils";
import type { ActionResult } from "../types";

const Schema = z.object({
  studentId: z.string().trim().min(1),
  currentBatchId: z.string().trim().min(1),
  newBatchId: z.string().trim().min(1),
}).refine(
  (data) => data.currentBatchId !== data.newBatchId,
  {
    message: "Select a different batch",
    path: ["newBatchId"],
  }
);

export async function replaceStudentBatchEnrollment(
  studentId: string,
  currentBatchId: string,
  newBatchId: string
): Promise<ActionResult> {
  try {
    await requireRoleForAction(["ADMIN", "TEACHER"]);

    const parsed = Schema.safeParse({
      studentId,
      currentBatchId,
      newBatchId,
    });

    if (!parsed.success) {
      return {
        success: false,
        error: parsed.error.issues[0]?.message ?? "Invalid input",
      };
    }

    await replaceStudentBatchEnrollmentService(
      parsed.data.studentId,
      parsed.data.currentBatchId,
      parsed.data.newBatchId
    );

    return {
      success: true,
      message: "Student batch changed successfully",
    };
  } catch (error) {
    return {
      success: false,
      error: getActionError(error, "Failed to change student batch"),
    };
  }
}
