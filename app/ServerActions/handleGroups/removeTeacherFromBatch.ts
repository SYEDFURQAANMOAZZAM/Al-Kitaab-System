"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/dist/server/web/spec-extension/revalidate";
import { requireRoleForAction } from "@/lib/auth/require-role";

export async function removeTeacherFromBatch(
  teacherId: string,
  batchId: string,
) {
  if (!teacherId || !batchId) {
    return {
      success: false,
      error: "Invalid request.",
    };
  }

  try {
    await requireRoleForAction(["ADMIN", "TEACHER"]);

    const assignments =
      await prisma.teacherAssignment.findMany({
        where: {
          teacherId,
        },
        select: {
          id: true,
          batchId: true,
        },
      });

    const currentAssignment =
      assignments.find(
        (assignment) =>
          assignment.batchId === batchId,
      );

    if (!currentAssignment) {
      return {
        success: false,
        error:
          "Teacher is not assigned to this batch.",
      };
    }

    /*
     * Teacher must belong to another batch.
     */
    if (assignments.length <= 1) {
      return {
        success: false,
        error:
          "Teacher cannot be removed because this is their only batch.",
      };
    }

    await prisma.teacherAssignment.delete({
      where: {
        id: currentAssignment.id,
      },
    });
    revalidatePath("/Admin/branches");
    return {
      success: true,
    };
  } catch (error) {
    console.error(
      "removeTeacherFromBatch:",
      error,
    );

    return {
      success: false,
      error:
        "Failed to remove teacher from batch.",
    };
  }
}