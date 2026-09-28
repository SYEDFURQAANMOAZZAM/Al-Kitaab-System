"use server";

import { revalidatePath } from "next/cache";
import { requireRoleForAction } from "@/lib/auth/require-role";

import { createBatchService } from "../service/batch.service";
import { GroupActionState } from "../types/batch.types";

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

  const result =
    await createBatchService(
      branchId,
      batchname
    );

  if (result.error) {
    return result;
  }

  revalidatePath("/admin/branches");

  return result;
};

export default createBatch;