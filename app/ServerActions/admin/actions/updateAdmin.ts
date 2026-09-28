"use server";

import { requireRoleForAction } from "@/lib/auth/require-role";

import {
  updateAdminService,
} from "../services/updateAdmin.service";

import {
  FormStateAdmin,
} from "../types/updateAdmin.types";

export async function updateAdmin(
  userId: string,
  state: FormStateAdmin,
  formData: FormData,
): Promise<FormStateAdmin> {
  await requireRoleForAction(["ADMIN"]);

  return updateAdminService(
    userId,
    state,
    formData,
  );
}