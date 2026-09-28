"use server";

import { revalidatePath } from "next/cache";

import { requireRoleForAction } from "@/lib/auth/require-role";

import { updateBatchService } from "../service/batch.service";
import type { GroupActionState } from "../types/batch.types";

const updateBatch = async (
  batchId: string,
  _state: GroupActionState,
  formData: FormData
): Promise<GroupActionState> => {
  await requireRoleForAction(["ADMIN"]);

  const batchName = formData.get("batchName");

  if (
    typeof batchName !== "string" ||
    !batchName.trim()
  ) {
    return {
      error: "Batch name is required.",
    };
  }

  const subjectIds = formData
    .getAll("subjectIds")
    .filter(
      (id): id is string =>
        typeof id === "string" && id.trim().length > 0
    );

  const result = await updateBatchService(
    batchId,
    batchName,
    subjectIds
  );

  if (result.error) {
    return result;
  }

  revalidatePath("/admin/branches");

  return result;
};

export default updateBatch;