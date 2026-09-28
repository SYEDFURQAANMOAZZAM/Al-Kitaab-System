"use server";

import { revalidatePath } from "next/cache";
import { requireRoleForAction } from "@/lib/auth/require-role";

import { createBranchService } from "../service/branch.service";
import { GroupActionState } from "../types/branch.types";

const createBranchAction = async (
  _state: GroupActionState,
  formData: FormData
): Promise<GroupActionState> => {
  await requireRoleForAction(["ADMIN"]);

  const branchname = formData.get("branchname");

  if (
    typeof branchname !== "string" ||
    !branchname.trim()
  ) {
    return {
      error: "Branch name is required.",
    };
  }

  const result =
    await createBranchService(branchname);

  if (result.error) {
    return result;
  }

  revalidatePath("/admin/branches");

  return result;
};

export default createBranchAction;