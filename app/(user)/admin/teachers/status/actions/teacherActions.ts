"use server";

import AuthVerify from "@/app/ServerActions/auth/authVerify";
import { prisma } from "@/lib/prisma";

export async function deleteTeacherAction(
  teacherId: string
) {
  try {
    await AuthVerify("ADMIN");

    if (!teacherId) {
      return {
        success: false,
        error: "Teacher ID is required.",
      };
    }

    const teacher =
      await prisma.teacher.findUnique({
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

    return {
      success: true,
    };
  } catch (error) {
    console.error(
      "deleteTeacherAction:",
      error
    );

    return {
      success: false,
      error: "Failed to delete teacher.",
    };
  }
}