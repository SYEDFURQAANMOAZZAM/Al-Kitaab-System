"use server";

import { revalidatePath } from "next/cache";

import AuthVerify from "@/app/ServerActions/auth/authVerify";

import { updateStudentService } from "./services/updateStudent.service";

import type { FormStateRegister } from "../auth/Validate";

export async function updateStudent(
  userId: string,
  _state: FormStateRegister,
  formData: FormData,
): Promise<FormStateRegister> {
  const session = await AuthVerify(
    "ADMIN",
    "TEACHER",
    "STUDENT",
  );

  const result =
    await updateStudentService(
      userId,
      _state,
      formData,
      {
        id: session.id,
        role: session.role,
      },
    );

  if (result.success) {
    revalidatePath(
      "/admin/students/stats",
    );

    revalidatePath(
      "/admin/branches",
    );

    revalidatePath(
      `/admin/students/stats/${userId}/edit`,
    );
  }

  return result;
}