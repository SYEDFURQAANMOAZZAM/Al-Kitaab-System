"use server";

import { revalidatePath } from "next/cache";
import { requireRoleForAction } from "@/lib/auth/require-role";

import { deleteStudentService } from "./services/deleteStudent.service";

export async function deleteStudent(
  studentId: string,
) {
  try {
    await requireRoleForAction(["ADMIN","TEACHER"]);

    const result =
      await deleteStudentService(studentId);

    if (result.success) {
      revalidatePath(
        "/(user)/admin/students/stats",
      );
    }

    return result;
  } catch (error) {
    console.error("deleteStudent:", error);

    return {
      success: false,
      error: "Failed to delete student.",
    };
  }
}