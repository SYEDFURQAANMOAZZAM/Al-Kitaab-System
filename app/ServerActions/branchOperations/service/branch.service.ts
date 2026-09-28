import { Prisma } from "@/generated/prisma/client";
import {
  createBranch,
  updateBranch,
  deleteBranch,
  getBranchesAndBatches,
} from "../queries/branch.queries";

export async function createBranchService(
  name: string
) {
  try {
    await createBranch(name.trim());

    return {
      success: "Branch created.",
    };
  } catch (error) {
    if (
      error instanceof
        Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return {
        error:
          "A branch with this name already exists.",
      };
    }

    console.error(
      "Unable to create branch",
      error
    );

    return {
      error:
        "Unable to create branch. Please try again.",
    };
  }
}

export async function updateBranchService(
  branchId: string,
  name: string
) {
  try {
    await updateBranch(
      branchId,
      name.trim()
    );

    return {
      success: "Branch updated.",
    };
  } catch (error) {
    if (
      error instanceof
        Prisma.PrismaClientKnownRequestError
    ) {
      if (error.code === "P2002") {
        return {
          error:
            "A branch with this name already exists.",
        };
      }

      if (error.code === "P2025") {
        return {
          error: "Branch not found.",
        };
      }
    }

    console.error(
      "Unable to update branch",
      error
    );

    return {
      error:
        "Unable to update branch. Please try again.",
    };
  }
}

export async function deleteBranchService(
  branchId: string
) {
  try {
    await deleteBranch(branchId);

    return {
      success: "Branch deleted.",
    };
  } catch (error) {
    if (
      error instanceof
        Prisma.PrismaClientKnownRequestError
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

    console.error(
      "Unable to delete branch:",
      error
    );

    return {
      error:
        "Unable to delete branch. Please try again.",
    };
  }
}

export async function getBranchesAndBatchesService() {
  return getBranchesAndBatches();
}