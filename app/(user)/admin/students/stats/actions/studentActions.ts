"use server";

import { prisma } from "@/lib/prisma";
import AuthVerify from "@/app/ServerActions/auth/authVerify";

export async function deleteStudentAction(
  studentId: string
) {
  try {
    await AuthVerify("ADMIN");

    if (!studentId) {
      return {
        success: false,
        error: "Student ID is required.",
      };
    }

    const student =
      await prisma.student.findUnique({
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

    return {
      success: true,
    };
  } catch (error) {
    console.error(
      "deleteStudentAction:",
      error
    );

    return {
      success: false,
      error: "Failed to delete student.",
    };
  }
}