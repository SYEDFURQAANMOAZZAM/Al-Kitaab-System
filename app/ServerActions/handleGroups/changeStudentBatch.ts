"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/dist/server/web/spec-extension/revalidate";
import { requireRoleForAction } from "@/lib/auth/require-role";

export async function changeStudentBatch(
  studentId: string,
  currentBatchId: string,
  newBatchId: string,
) {
  if (
    !studentId ||
    !currentBatchId ||
    !newBatchId
  ) {
    return {
      success: false,
      error: "Invalid request.",
    };
  }
 requireRoleForAction(["ADMIN","TEACHER"])
  if (currentBatchId === newBatchId) {
    return {
      success: false,
      error: "Student is already in this batch.",
    };
  }

  try {
    // await requireRoleForAction(["ADMIN", "TEACHER"]);

    await prisma.$transaction(async (tx) => {
      const currentEnrollment =
        await tx.studentEnrollment.findUnique({
          where: {
            studentId_batchId: {
              studentId,
              batchId: currentBatchId,
            },
          },
        });

      if (!currentEnrollment) {
        throw new Error(
          "Student is not enrolled in the current batch.",
        );
      }

      const newBatch = await tx.batch.findUnique({
        where: {
          id: newBatchId,
        },
        select: {
          id: true,
        },
      });

      if (!newBatch) {
        throw new Error(
          "Selected batch does not exist.",
        );
      }

      /*
       * Delete old enrollment.
       */
      await tx.studentEnrollment.delete({
        where: {
          id: currentEnrollment.id,
        },
      });

      /*
       * Create new enrollment.
       */
      await tx.studentEnrollment.create({
        data: {
          studentId,
          batchId: newBatchId,
        },
      });
    });
    revalidatePath("/Admin/branches");
    return {
      success: true,
    };
  } catch (error) {
    console.error(
      "changeStudentBatch:",
      error,
    );

    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to change student batch.",
    };
  }
}