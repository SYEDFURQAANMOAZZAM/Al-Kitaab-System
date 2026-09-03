"use server";

import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireRoleForAction } from "@/lib/auth/require-role";

const UpdatePatternSchema = z.object({
  id: z.string().min(1, "Pattern ID is required"),

  name: z.string().trim().min(1, "Pattern name is required"),

  parts: z
    .array(
      z.object({
        name: z.string().trim().min(1, "Pattern part cannot be empty"),
        position: z.number().int().nonnegative(),
      })
    )
    .min(1, "Add at least one pattern part"),

  batchIds: z
    .array(z.string().min(1))
    .min(1, "Select at least one batch"),
});

export async function updatePattern(input: unknown) {
  await requireRoleForAction(["ADMIN"]);

  const parsed = UpdatePatternSchema.safeParse(input);

  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Invalid data",
    };
  }

  const { id, name, parts, batchIds } = parsed.data;

  // Always normalize positions to 0, 1, 2, 3...
  const normalizedParts = parts.map((part, index) => ({
    name: part.name,
    position: index,
  }));

  // Remove duplicate batch IDs
  const uniqueBatchIds = [...new Set(batchIds)];

  try {
    const pattern = await prisma.$transaction(async (tx) => {
      // Check if pattern exists
      const existingPattern = await tx.pattern.findUnique({
        where: {
          id,
        },
        select: {
          id: true,
        },
      });

      if (!existingPattern) {
        throw new Error("Pattern not found");
      }

      // Verify that all selected batches exist
      const batches = await tx.batch.findMany({
        where: {
          id: {
            in: uniqueBatchIds,
          },
        },
        select: {
          id: true,
        },
      });

      if (batches.length !== uniqueBatchIds.length) {
        throw new Error("One or more selected batches do not exist");
      }

      // Delete existing pattern parts
      await tx.patternArr.deleteMany({
        where: {
          patternId: id,
        },
      });

      // Delete existing batch-pattern relationships
      await tx.batchPattern.deleteMany({
        where: {
          patternId: id,
        },
      });

      // Update pattern and recreate its relations
      const updatedPattern = await tx.pattern.update({
        where: {
          id,
        },

        data: {
          name,

          patternArr: {
            create: normalizedParts,
          },

          batches: {
            create: uniqueBatchIds.map((batchId) => ({
              batchId,
            })),
          },
        },

        include: {
          patternArr: {
            orderBy: {
              position: "asc",
            },
          },

          batches: {
            include: {
              batch: true,
            },
          },
        },
      });

      return updatedPattern;
    });

    return {
      success: true,
      pattern,
    };
  } catch (error) {
    console.error("updatePattern error:", error);

    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to update study pattern",
    };
  }
}

