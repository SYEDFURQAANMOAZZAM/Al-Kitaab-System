
"use server";

import { z } from "zod";
import { requireRoleForAction } from "@/lib/auth/require-role";
import { addSubjectToStudentService } from "../services/studentSubjectService";
import { getActionError } from "./actionUtils";
import type { ActionResult } from "../types";

const Schema = z.object({
  studentId: z.string().trim().min(1),
  batchId: z.string().trim().min(1),
  subjectId: z.string().trim().min(1),
});

export async function addSubjectToStudent(
  studentId: string,
  batchId: string,
  subjectId: string
): Promise<ActionResult> {
  try {
    await requireRoleForAction(["ADMIN", "TEACHER"]);

    const parsed = Schema.safeParse({ studentId, batchId, subjectId });

    if (!parsed.success) {
      return {
        success: false,
        error: parsed.error.issues[0]?.message ?? "Invalid input",
      };
    }

    await addSubjectToStudentService(
      parsed.data.studentId,
      parsed.data.batchId,
      parsed.data.subjectId
    );

    return {
      success: true,
      message: "Subject added to student successfully",
    };
  } catch (error) {
    return {
      success: false,
      error: getActionError(error, "Failed to add subject to student"),
    };
  }
}
