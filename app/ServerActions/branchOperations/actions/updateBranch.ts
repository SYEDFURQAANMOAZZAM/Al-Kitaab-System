"use server";

import { revalidatePath } from "next/cache";
import { requireRoleForAction } from "@/lib/auth/require-role";

import { updateBranchService } from "../service/branch.service";
import { GroupActionState } from "../types/branch.types";

const updateBranchAction = async (
  branchId: string,
  _state: GroupActionState,
  formData: FormData
): Promise<GroupActionState> => {
  await requireRoleForAction(["ADMIN"]);

  const branchname = formData.get("branchName");

  if (
    typeof branchname !== "string" ||
    !branchname.trim()
  ) {
    return {
      error: "Branch name is required.",
    };
  }

  const result =
    await updateBranchService(
      branchId,
      branchname
    );

  if (result.error) {
    return result;
  }

  revalidatePath("/admin/branches");

  return result;
};

export default updateBranchAction;