"use server";

import { prisma } from "@/lib/prisma";
import { requireRoleForAction } from "@/lib/auth/require-role";

export async function deleteSubject(id: string) {
  await requireRoleForAction(["ADMIN", "TEACHER"]);

  if (!id) {
    return {
      success: false,
      error: "Subject ID is required",
    };
  }

  try {
    await prisma.subject.delete({
      where: {
        id,
      },
    });

    return {
      success: true,
    };
  } catch (error) {
    console.error("deleteSubject error:", error);

    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to delete subject",
    };
  }
}
