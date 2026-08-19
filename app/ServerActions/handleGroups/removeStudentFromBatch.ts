"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { requireRoleForAction } from "@/lib/auth/require-role";

export async function removeStudentFromBatch(
  studentId: string,
  batchId: string,
) {
  if (!studentId || !batchId) {
    return {
      success: false,
      error: "Invalid request.",
    };
  }

  try {
    await requireRoleForAction(["ADMIN", "TEACHER"]);

    const enrollments =
      await prisma.studentEnrollment.findMany({
        where: {
          studentId,
        },
        select: {
          id: true,
          batchId: true,
        },
      });

    const currentEnrollment =
      enrollments.find(
        (enrollment) =>
          enrollment.batchId === batchId,
      );

    if (!currentEnrollment) {
      return {
        success: false,
        error:
          "Student is not enrolled in this batch.",
      };
    }

    /*
     * Student must belong to another batch.
     */
    if (enrollments.length <= 1) {
      return {
        success: false,
        error:
          "Student cannot be removed because this is their only batch.",
      };
    }

    await prisma.studentEnrollment.delete({
      where: {
        id: currentEnrollment.id,
      },
    });
    revalidatePath("/Admin/branches");
    return {
      success: true,
    };
  } catch (error) {
    console.error(
      "removeStudentFromBatch:",
      error,
    );

    return {
      success: false,
      error:
        "Failed to remove student from batch.",
    };
  }
}