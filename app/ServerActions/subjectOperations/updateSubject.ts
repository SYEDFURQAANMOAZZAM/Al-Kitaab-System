"use server";

import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireRoleForAction } from "@/lib/auth/require-role";

const TrackingTermSchema = z.object({
  name: z.string().trim().min(1, "Tracking term name is required"),
  position: z.number().int().nonnegative(),
});

const UpdateSubjectSchema = z.object({
  id: z.string().min(1, "Subject ID is required"),

  name: z.string().trim().min(1, "Subject name is required"),

  parts: z
    .array(
      z.object({
        name: z.string().trim().min(1, "Subject part cannot be empty"),
        position: z.number().int().nonnegative(),
      }),
    )
    .min(1, "Add at least one subject part"),

  batchIds: z
    .array(z.string().min(1))
    .min(1, "Select at least one batch"),

  trackingTerms: z
    .array(TrackingTermSchema)
    .default([]),
});

export async function updateSubject(input: unknown) {
  await requireRoleForAction(["ADMIN", "TEACHER"]);

  const parsed = UpdateSubjectSchema.safeParse(input);

  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Invalid data",
    };
  }

  const {
    id,
    name,
    parts,
    batchIds,
    trackingTerms,
  } = parsed.data;

  const normalizedParts = parts.map((part, index) => ({
    name: part.name,
    position: index,
  }));

  const normalizedTrackingTerms = trackingTerms.map((term, index) => ({
    name: term.name,
    position: index,
  }));

  const uniqueBatchIds = [...new Set(batchIds)];

  try {
    const subject = await prisma.$transaction(async (tx) => {
      const existingSubject = await tx.subject.findUnique({
        where: {
          id,
        },
        select: {
          id: true,
        },
      });

      if (!existingSubject) {
        throw new Error("Subject not found");
      }

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

      const duplicateTermNames = new Set<string>();

      for (const term of normalizedTrackingTerms) {
        const key = term.name.toLowerCase();

        if (duplicateTermNames.has(key)) {
          throw new Error(`Duplicate tracking term: ${term.name}`);
        }

        duplicateTermNames.add(key);
      }

      await tx.subjectPart.deleteMany({
        where: {
          subjectId: id,
        },
      });

      await tx.batchSubject.deleteMany({
        where: {
          subjectId: id,
        },
      });

      await tx.subjectTrackingTerm.deleteMany({
        where: {
          subjectId: id,
        },
      });

      const updatedSubject = await tx.subject.update({
        where: {
          id,
        },

        data: {
          name,

          parts: {
            create: normalizedParts,
          },

          batches: {
            create: uniqueBatchIds.map((batchId) => ({
              batchId,
            })),
          },

          trackingTerms: {
            create: normalizedTrackingTerms,
          },
        },

        include: {
          parts: {
            orderBy: {
              position: "asc",
            },
          },

          batches: {
            include: {
              batch: true,
            },
          },

          trackingTerms: {
            orderBy: {
              position: "asc",
            },
          },
        },
      });

      return updatedSubject;
    });

    return {
      success: true,
      subject,
    };
  } catch (error) {
    console.error("updateSubject error:", error);

    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to update subject",
    };
  }
}
