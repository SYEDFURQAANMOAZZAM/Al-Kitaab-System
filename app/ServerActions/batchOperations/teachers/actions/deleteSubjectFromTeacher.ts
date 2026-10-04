
"use server";

import { z } from "zod";
import { requireRoleForAction } from "@/lib/auth/require-role";
import { deleteSubjectFromTeacherService } from "../services/teacherSubjectService";
import type { ActionResult } from "../types";

const Schema = z.object({
  teacherId: z.string().min(1),
  subjectId: z.string().min(1),
});

export async function deleteSubjectFromTeacher(
  teacherId: string,
  subjectId: string,
): Promise<ActionResult<{ teacherId: string; subjectId: string }>> {
  try {
    await requireRoleForAction(["ADMIN"]);

    const parsed = Schema.safeParse({ teacherId, subjectId });
    if (!parsed.success) {
      return { success: false, error: "Invalid teacher or subject ID." };
    }

    const data = await deleteSubjectFromTeacherService(
      parsed.data.teacherId,
      parsed.data.subjectId,
    );

    return { success: true, data };
  } catch (error) {
    console.error("deleteSubjectFromTeacher:", error);
    return {
      success: false,
      error: error instanceof Error
        ? error.message
        : "Failed to remove subject from teacher.",
    };
  }
}
