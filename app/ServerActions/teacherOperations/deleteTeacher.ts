"use server";

import { prisma } from "@/lib/prisma";
import { requireRoleForAction } from "@/lib/auth/require-role";
import { revalidatePath } from "next/cache";

export async function deleteTeacher(teacherId: string) {
  try {
    await requireRoleForAction(["ADMIN"]);

    if (!teacherId) {
      return {
        success: false,
        error: "Teacher ID is required.",
      };
    }

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
        error: "Teacher not found.",
      };
    }

    await prisma.user.delete({
      where: {
        id: teacher.userId,
      },
    });

    revalidatePath("/(user)/admin/teachers/status");

    return {
      success: true,
    };
  } catch (error) {
    console.error("deleteTeacher:", error);

    return {
      success: false,
      error: "Failed to delete teacher.",
    };
  }
}