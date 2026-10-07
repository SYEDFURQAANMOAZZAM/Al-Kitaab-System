"use server";

import { requireRoleForAction } from "@/lib/auth/require-role";
import { updateProgressLearningRemarkService } from "../services/updateProgressLearningRemark.service";
import type { UpdateProgressLearningRemarkInput } from "../types/progressRelated.types";

export async function updateProgressLearningRemark(
  data: UpdateProgressLearningRemarkInput,
) {
  await requireRoleForAction(["ADMIN", "TEACHER"]);

  return updateProgressLearningRemarkService(data);
}
