"use server";

import { Prisma } from "@/generated/prisma/client";
import { requireRoleForAction } from "@/lib/auth/require-role";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import type { GroupActionState } from "./createBranch";

const createBatch = async (
  branchId: string,
  _state: GroupActionState,
  formData: FormData
): Promise<GroupActionState> => {
  await requireRoleForAction(["ADMIN"]);

  const batchname = formData.get("batchname");

  if (
    typeof batchname !== "string" ||
    !batchname.trim()
  ) {
    return {
      error: "Batch name is required.",
    };
  }

  const branch = await prisma.branch.findUnique({
    where: {
      id: branchId,
    },
    select: {
      id: true,
    },
  });

  if (!branch) {
    return {
      error: "The selected branch no longer exists.",
    };
  }

  try {
    await prisma.batch.create({
      data: {
        name: batchname.trim(),
        branchId,
      },
    });
  } catch (error) {
    if (
      error instanceof
        Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return {
        error:
          "A batch with this name already exists in this branch.",
      };
    }

    console.error(
      "Unable to create batch",
      error
    );

    return {
      error:
        "Unable to create batch. Please try again.",
    };
  }

  revalidatePath("/Admin/branches");

  return {
    success: "Batch created.",
  };
};

export default createBatch;