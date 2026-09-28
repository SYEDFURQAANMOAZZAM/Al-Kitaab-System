"use server";

import {
  requireRoleForAction,
} from "@/lib/auth/require-role";

import { submitProgressService } from "../services/submitProgress.service";

import type {
  SubmitProgressInput,
} from "../types/submitProgress.types";

export async function submitProgress(
  data: SubmitProgressInput,
) {
  await requireRoleForAction([
    "ADMIN",
    "TEACHER",
  ]);


  return submitProgressService(
    data,
  );
}