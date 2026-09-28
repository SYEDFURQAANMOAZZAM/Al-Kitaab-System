import { Prisma } from "@/generated/prisma/client";
import {
  findBranch,
  createBatch,
  updateBatch,
  deleteBatch,
} from "../queries/batch.queries";

export async function createBatchService(
  branchId: string,
  name: string
) {
  const branch = await findBranch(branchId);

  if (!branch) {
    return {
      error: "The selected branch no longer exists.",
    };
  }

  try {
    await createBatch(
      branchId,
      name.trim()
    );

    return {
      success: "Batch created.",
    };
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
}

export async function updateBatchService(
  batchId: string,
  name: string
) {
  try {
    await updateBatch(
      batchId,
      name.trim()
    );

    return {
      success: "Batch updated.",
    };
  } catch (error) {
    if (
      error instanceof
        Prisma.PrismaClientKnownRequestError
    ) {
      if (error.code === "P2002") {
        return {
          error:
            "A batch with this name already exists.",
        };
      }

      if (error.code === "P2025") {
        return {
          error: "Batch not found.",
        };
      }
    }

    console.error(
      "Unable to update batch",
      error
    );

    return {
      error:
        "Unable to update batch. Please try again.",
    };
  }
}

export async function deleteBatchService(
  batchId: string
) {
  try {
    await deleteBatch(batchId);

    return {
      success: "Batch deleted.",
    };
  } catch (error) {
    if (
      error instanceof
        Prisma.PrismaClientKnownRequestError
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

    console.error(
      "Unable to delete batch:",
      error
    );

    return {
      error:
        "Unable to delete batch. Please try again.",
    };
  }
}