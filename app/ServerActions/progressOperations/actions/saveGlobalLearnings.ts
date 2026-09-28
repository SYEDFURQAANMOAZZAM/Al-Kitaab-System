"use server";

import { revalidatePath } from "next/cache";

import {
  requireRoleForAction,
} from "@/lib/auth/require-role";

import { saveGlobalLearningsService } from "../services/saveGlobalLearnings.service";

import type {
  SaveGlobalLearningsInput,
} from "../types/saveGlobalLearnings.types";

export async function saveGlobalLearnings(
  data: SaveGlobalLearningsInput,
) {
  await requireRoleForAction([
    "ADMIN",
    "TEACHER",
  ]);

  const results =
    await saveGlobalLearningsService(
      data,
    );

  revalidatePath(
    `/admin/branches/${data.batchId}/progress`,
    "page",
  );

  return {
    success: true,

    progressIds: results.map(
      (progress) => progress.id,
    ),

    progress: results.map(
      (progress) => progress.learnings,
    ),
  };
}