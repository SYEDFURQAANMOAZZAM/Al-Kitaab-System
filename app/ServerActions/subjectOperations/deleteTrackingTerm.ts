"use server";

import { prisma } from "@/lib/prisma";
import { requireRoleForAction } from "@/lib/auth/require-role";

export async function deleteTrackingTerm(
  id: string,
  subjectId?: string,
) {
  await requireRoleForAction(["ADMIN", "TEACHER"]);

  if (!id) {
    return {
      success: false,
      error: "Tracking term ID is required",
    };
  }

  try {
    const existingTerm =
      await prisma.subjectTrackingTerm.findUnique({
        where: {
          id,
        },
        select: {
          id: true,
          subjectId: true,
        },
      });

    if (!existingTerm) {
      return {
        success: false,
        error: "Tracking term not found",
      };
    }

    if (subjectId && existingTerm.subjectId !== subjectId) {
      return {
        success: false,
        error: "Tracking term does not belong to this subject",
      };
    }

    await prisma.subjectTrackingTerm.delete({
      where: {
        id,
      },
    });

    return {
      success: true,
    };
  } catch (error) {
    console.error("deleteTrackingTerm error:", error);

    return {
      success: false,
      error: "Failed to delete tracking term",
    };
  }
}
