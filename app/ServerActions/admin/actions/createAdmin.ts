"use server";

import { requireRoleForAction } from "@/lib/auth/require-role";

import {
  createAdminService,
} from "../services/createAdmin.service";

import {
  FormStateAdmin,
} from "../types/admin.types";

export async function createAdmin(
  state: FormStateAdmin,
  formData: FormData,
): Promise<FormStateAdmin> {
  await requireRoleForAction(["ADMIN"]);

  return createAdminService(
    state,
    formData,
  );
}