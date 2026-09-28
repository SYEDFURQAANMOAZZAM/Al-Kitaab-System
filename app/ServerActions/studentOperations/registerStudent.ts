"use server";

import { requireRoleForAction } from "@/lib/auth/require-role";

import { createStudentService } from "./services/createStudent.service";

import type { FormStateRegister } from "../auth/Validate";

export async function createStudent(
  _state: FormStateRegister,
  formData: FormData,
): Promise<FormStateRegister> {
  await requireRoleForAction([
    "ADMIN",
    "TEACHER",
  ]);

  return createStudentService(
    _state,
    formData,
  );
}