"use server";

import { prisma } from "@/lib/prisma";
import { requireRoleForAction } from "@/lib/auth/require-role";
import { revalidatePath } from "next/dist/server/web/spec-extension/revalidate";

export async function deleteTeacher(teacherId: string) {
  await requireRoleForAction(["ADMIN"]);

  const teacher = await prisma.teacher.findUnique({
    where: {
      id: teacherId,
    },
    select: {
      userId: true,
    },
  });

  if (!teacher) {
    return {
      success: false,
      error: "teacher not found.",
    };
  }

  await prisma.user.delete({
    where: {
      id: teacher.userId,
    },
  });
  revalidatePath("/(user)/Admin/teachers/status");
  return {
    success: true,
  };
}