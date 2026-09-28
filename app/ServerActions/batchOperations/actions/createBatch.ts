"use server";

import { revalidatePath } from "next/cache";

import { requireRoleForAction } from "@/lib/auth/require-role";

import { createBatchService } from "../service/batch.service";
import type { GroupActionState } from "../types/batch.types";

const createBatch = async (
  branchId: string,
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

  const result = await createBatchService(
    branchId,
    batchName,
    subjectIds
  );

  if (result.error) {
    return result;
  }

  revalidatePath("/admin/branches");
  revalidatePath(`/admin/branches/${branchId}`);

  return result;
};

export default createBatch;