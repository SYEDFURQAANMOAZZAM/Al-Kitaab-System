"use server";

import { requireRoleForAction } from "@/lib/auth/require-role";

import { getBranchesAndBatchesService } from "../service/branch.service";

const getBranchesAndBatches = async () => {
  await requireRoleForAction([
    "ADMIN",
    "TEACHER",
  ]);

  return getBranchesAndBatchesService();
};

export default getBranchesAndBatches;