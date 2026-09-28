"use server";

import { revalidatePath } from "next/cache";
import { requireRoleForAction } from "@/lib/auth/require-role";

import { updateBatchService } from "../service/batch.service";
import { GroupActionState } from "../types/batch.types";

const updateBatch = async (
  batchId: string,
  _state: GroupActionState,
  formData: FormData
): Promise<GroupActionState> => {
  await requireRoleForAction(["ADMIN"]);

  const batchname = formData.get("batchName");

  if (
    typeof batchname !== "string" ||
    !batchname.trim()
  ) {
    return {
      error: "Batch name is required.",
    };
  }

  const result =
    await updateBatchService(
      batchId,
      batchname
    );

  if (result.error) {
    return result;
  }

  revalidatePath("/admin/branches");

  return result;
};

export default updateBatch;