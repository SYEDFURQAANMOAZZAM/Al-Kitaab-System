"use server";

import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireRoleForAction } from "@/lib/auth/require-role";

const CreateTrackingTermSchema = z.object({
  subjectId: z.string().min(1, "Subject ID is required"),
  name: z.string().trim().min(1, "Tracking term name is required"),
  position: z.number().int().nonnegative().optional(),
});

export async function createTrackingTerm(input: unknown) {
  await requireRoleForAction(["ADMIN", "TEACHER"]);

  const parsed = CreateTrackingTermSchema.safeParse(input);

  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Invalid data",
    };
  }

  const { subjectId, name, position } = parsed.data;

  try {
    const trackingTerm = await prisma.$transaction(async (tx) => {
      const subject = await tx.subject.findUnique({
        where: {
          id: subjectId,
        },
        select: {
          id: true,
        },
      });

      if (!subject) {
        throw new Error("Subject not found");
      }

      const existingTerms = await tx.subjectTrackingTerm.findMany({
        where: {
          subjectId,
        },
        select: {
          id: true,
          name: true,
          position: true,
        },
        orderBy: {
          position: "asc",
        },
      });

      if (
        existingTerms.some(
          (term) =>
            term.name.trim().toLowerCase() === name.trim().toLowerCase(),
        )
      ) {
        throw new Error("A tracking term with this name already exists");
      }

      const nextPosition =
        position ?? existingTerms.length;

      if (
        existingTerms.some(
          (term) => term.position === nextPosition,
        )
      ) {
        throw new Error(
          "A tracking term already exists at this position",
        );
      }

      return tx.subjectTrackingTerm.create({
        data: {
          subjectId,
          name: name.trim(),
          position: nextPosition,
        },
      });
    });

    return {
      success: true,
      trackingTerm,
    };
  } catch (error) {
    console.error("createTrackingTerm error:", error);

    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to create tracking term",
    };
  }
}
