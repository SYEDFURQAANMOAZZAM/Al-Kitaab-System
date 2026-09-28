"use server";

import { revalidatePath } from "next/cache";
import { requireRoleForAction } from "@/lib/auth/require-role";

import { deleteBranchService } from "../service/branch.service";
import { GroupActionState } from "../types/branch.types";

const deleteBranchAction = async (
  branchId: string,
  _state: GroupActionState
): Promise<GroupActionState> => {
  try {
    await requireRoleForAction(["ADMIN"]);
  } catch {
    return {
      error:
        "You do not have permission to delete this branch.",
    };
  }

  if (!branchId) {
    return {
      error: "Invalid branch.",
    };
  }

  const result =
    await deleteBranchService(branchId);

  if (result.error) {
    return result;
  }

  revalidatePath("/admin/branches");

  return result;
};

export default deleteBranchAction;