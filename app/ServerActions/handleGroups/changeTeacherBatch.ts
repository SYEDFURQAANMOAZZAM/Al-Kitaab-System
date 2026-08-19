"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/dist/server/web/spec-extension/revalidate";
import { requireRoleForAction } from "@/lib/auth/require-role";

export async function changeTeacherBatch(
  teacherId: string,
  currentBatchId: string,
  newBatchId: string,
) {
  if (
    !teacherId ||
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
      error: "Teacher is already in this batch.",
    };
  }

  try {
    // await requireRoleForAction(["ADMIN", "TEACHER"]);

    await prisma.$transaction(async (tx) => {
      const currentAssignment =
        await tx.teacherAssignment.findUnique({
          where: {
            teacherId_batchId: {
              teacherId,
              batchId: currentBatchId,
            },
          },
        });

      if (!currentAssignment) {
        throw new Error(
          "Teacher is not assigned to the current batch.",
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
       * Delete old assignment.
       */
      await tx.teacherAssignment.delete({
        where: {
          id: currentAssignment.id,
        },
      });

      /*
       * Create new assignment.
       */
      await tx.teacherAssignment.create({
        data: {
          teacherId,
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
      "changeTeacherBatch:",
      error,
    );

    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to change teacher batch.",
    };
  }
}