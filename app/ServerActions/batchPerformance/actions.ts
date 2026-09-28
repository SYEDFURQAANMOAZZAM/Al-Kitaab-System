"use server";

import { requireRoleForAction } from "@/lib/auth/require-role";

import { getBatchPerformance } from "./queries";

export async function fetchBatchPerformance(
  batchId: string,
  year: number,
  month: number
) {
  await requireRoleForAction(["ADMIN"]);

  return getBatchPerformance(
    batchId,
    year,
    month
  );
}