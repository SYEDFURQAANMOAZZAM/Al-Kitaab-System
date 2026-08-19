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

const DeleteBranch = async (
  branchId: string,
  _state: GroupActionState
): Promise<GroupActionState> => {
  try {
    await requireRoleForAction(["ADMIN"]);
  } catch {
    return {
      error: "You do not have permission to delete this branch.",
    };
  }

  if (!branchId) {
    return {
      error: "Invalid branch.",
    };
  }

  try {
    await prisma.branch.delete({
      where: {
        id: branchId,
      },
    });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError
    ) {
      if (error.code === "P2025") {
        return {
          error: "Branch not found.",
        };
      }

      if (error.code === "P2003") {
        return {
          error:
            "Cannot delete branch with existing batches. Please delete the batches first.",
        };
      }
    }

    console.error("Unable to delete branch:", error);

    return {
      error: "Unable to delete branch. Please try again.",
    };
  }

  revalidatePath("/Admin/branches");

  return {
    success: "Branch deleted.",
  };
};

export default DeleteBranch;