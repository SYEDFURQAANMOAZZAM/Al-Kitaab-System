"use server";

import { prisma } from "@/lib/prisma";
import { requireRoleForAction } from "@/lib/auth/require-role";
import { revalidatePath } from "next/dist/server/web/spec-extension/revalidate";

export async function deleteStudent(studentId: string) {
  await requireRoleForAction(["ADMIN"]);

  const student = await prisma.student.findUnique({
    where: {
      id: studentId,
    },
    select: {
      userId: true,
    },
  });

  if (!student) {
    return {
      success: false,
      error: "Student not found.",
    };
  }

  await prisma.user.delete({
    where: {
      id: student.userId,
    },
  });
  revalidatePath("/(user)/Admin/students/stats");
  return {
    success: true,
  };
}