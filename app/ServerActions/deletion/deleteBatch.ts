"use server";

import { Prisma } from "@/generated/prisma/client";
import { requireRoleForAction } from "@/lib/auth/require-role";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export type GroupActionState =
  | {
      error?: string;
      success?: string;
    }
  | undefined;

const DeleteBatch = async (
  batchId: string,
  _state: GroupActionState
): Promise<GroupActionState> => {
  try {
    await requireRoleForAction(["ADMIN"]);
  } catch {
    return {
      error: "You do not have permission to delete this batch.",
    };
  }

  if (!batchId) {
    return {
      error: "Invalid batch.",
    };
  }

  try {
    await prisma.batch.delete({
      where: {
        id: batchId,
      },
    });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError
    ) {
      if (error.code === "P2025") {
        return {
          error: "Batch not found.",
        };
      }

      if (error.code === "P2003") {
        return {
          error:
            "Cannot delete batch with existing batches. Please delete the batches first.",
        };
      }
    }

    console.error("Unable to delete batch:", error);

    return {
      error: "Unable to delete batch. Please try again.",
    };
  }

  revalidatePath("/Admin/batches");

  return {
    success: "Batch deleted.",
  };
};

export default DeleteBatch;