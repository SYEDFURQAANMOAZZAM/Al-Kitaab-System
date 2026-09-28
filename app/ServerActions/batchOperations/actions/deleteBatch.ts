"use server";

import { revalidatePath } from "next/cache";
import { requireRoleForAction } from "@/lib/auth/require-role";

import { deleteBatchService } from "../service/batch.service";
import { GroupActionState } from "../types/batch.types";

const deleteBatch = async (
  batchId: string,
  _state: GroupActionState
): Promise<GroupActionState> => {
  try {
    await requireRoleForAction(["ADMIN"]);
  } catch {
    return {
      error:
        "You do not have permission to delete this batch.",
    };
  }

  if (!batchId) {
    return {
      error: "Invalid batch.",
    };
  }

  const result =
    await deleteBatchService(batchId);

  if (result.error) {
    return result;
  }

  revalidatePath("/admin/batches");

  return result;
};

export default deleteBatch;