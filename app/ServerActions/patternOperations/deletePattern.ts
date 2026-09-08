"use server";

import { prisma } from "@/lib/prisma";
import { requireRoleForAction } from "@/lib/auth/require-role";

export async function deletePattern(id: string) {
  await requireRoleForAction(["ADMIN","TEACHER"]);

  if (!id) {
    return {
      success: false,
      error: "Pattern ID is required",
    };
  }

  try {
    await prisma.pattern.delete({
      where: {
        id,
      },
    });

    return {
      success: true,
    };
  } catch (error) {
    console.error("deletePattern error:", error);

    return {
      success: false,
      error: "Failed to delete pattern",
    };
  }
}