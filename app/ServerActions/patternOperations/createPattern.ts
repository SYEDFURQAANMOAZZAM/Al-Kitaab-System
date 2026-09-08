"use server";

import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireRoleForAction } from "@/lib/auth/require-role";

const CreatePatternSchema = z.object({
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

export async function createPattern(input: unknown) {
  await requireRoleForAction(["ADMIN"]);

  const parsed = CreatePatternSchema.safeParse(input);

  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Invalid data",
    };
  }

  const { name, parts, batchIds } = parsed.data;

  // Make sure positions are always 0,1,2,3...
  const normalizedParts = parts.map((part, index) => ({
    name: part.name,
    position: index,
  }));

  // Remove duplicate batch IDs
  const uniqueBatchIds = [...new Set(batchIds)];

  try {
    const pattern = await prisma.$transaction(async (tx) => {
      // Optional but useful:
      // verify that all selected batches actually exist
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

      const createdPattern = await tx.pattern.create({
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

          batches: true,
        },
      });

      return createdPattern;
    });

    return {success: true};
  } catch (error) {
    console.error("createPattern error:", error);

    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to create study pattern",
    };
  }
}