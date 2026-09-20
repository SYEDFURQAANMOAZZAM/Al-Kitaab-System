"use server";

import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireRoleForAction } from "@/lib/auth/require-role";

const UpdateTrackingTermSchema = z.object({
  id: z.string().min(1, "Tracking term ID is required"),
  subjectId: z.string().min(1, "Subject ID is required"),
  name: z.string().trim().min(1, "Tracking term name is required"),
  position: z.number().int().nonnegative(),
});

export async function updateTrackingTerm(input: unknown) {
  await requireRoleForAction(["ADMIN", "TEACHER"]);

  const parsed = UpdateTrackingTermSchema.safeParse(input);

  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Invalid data",
    };
  }

  const {
    id,
    subjectId,
    name,
    position,
  } = parsed.data;

  try {
    const trackingTerm = await prisma.$transaction(async (tx) => {
      const existingTerm =
        await tx.subjectTrackingTerm.findUnique({
          where: {
            id,
          },
          select: {
            id: true,
            subjectId: true,
          },
        });

      if (!existingTerm) {
        throw new Error("Tracking term not found");
      }

      if (existingTerm.subjectId !== subjectId) {
        throw new Error(
          "Tracking term does not belong to this subject",
        );
      }

      const duplicateName =
        await tx.subjectTrackingTerm.findFirst({
          where: {
            subjectId,
            name: {
              equals: name.trim(),
              mode: "insensitive",
            },
            NOT: {
              id,
            },
          },
          select: {
            id: true,
          },
        });

      if (duplicateName) {
        throw new Error(
          "A tracking term with this name already exists",
        );
      }

      const duplicatePosition =
        await tx.subjectTrackingTerm.findFirst({
          where: {
            subjectId,
            position,
            NOT: {
              id,
            },
          },
          select: {
            id: true,
          },
        });

      if (duplicatePosition) {
        throw new Error(
          "A tracking term already exists at this position",
        );
      }

      return tx.subjectTrackingTerm.update({
        where: {
          id,
        },

        data: {
          name: name.trim(),
          position,
        },
      });
    });

    return {
      success: true,
      trackingTerm,
    };
  } catch (error) {
    console.error("updateTrackingTerm error:", error);

    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to update tracking term",
    };
  }
}
