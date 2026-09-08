"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth/require-role";

type PatternPart = {
  id: string;
  name: string;
  position: number;
};

type GlobalLearning = {
  id: string;

  pattern: {
    id: string;
    name: string;
    patternArr: PatternPart[];
  } | null;

  status: string;

  values: Record<string, string | { from: string; to?: string }>;
};

type SaveGlobalLearningsInput = {
  batchId: string;
  batchName: string;
  studentIds: string[];
  learnings: GlobalLearning[];
};

export async function saveGlobalLearnings(
  data: SaveGlobalLearningsInput
) {
  await requireRole("TEACHER", "ADMIN");

  if (data.studentIds.length === 0) {
    throw new Error("No students selected.");
  }

  if (data.learnings.length === 0) {
    throw new Error("No learnings provided.");
  }

  // Today's date in IST
  const indiaDate = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());

  const today = new Date(
    `${indiaDate}T00:00:00.000Z`
  );

  const results = await prisma.$transaction(
    async (tx) => {
      const savedProgress = [];

      /*
       * Convert global learning format into the
       * SAME format used by submitProgress().
       */
      const newLearnings = data.learnings.map(
        (learning) => ({
          learningId: learning.id,

          pattern: learning.pattern
            ? {
                id: learning.pattern.id,
                name: learning.pattern.name,
              }
            : null,

          status: learning.status,

          parts: learning.pattern
            ? learning.pattern.patternArr.map(
                (part) => ({
                  id: part.id,
                  name: part.name,
                  position: part.position,
                  value:
                    learning.values[part.id] ?? "",
                })
              )
            : [],
        })
      );

      const syncOverallProgress = async (studentId: string) => {
        for (const learning of newLearnings) {
          if (!learning.pattern) continue;
          const pattern = await tx.pattern.findUnique({ where: { id: learning.pattern.id }, select: { trackingStatus: true, patternArr: { orderBy: { position: "asc" }, select: { id: true } } } });
          if (!pattern || learning.status !== pattern.trackingStatus || !pattern.patternArr[0]) continue;
          const primary = learning.parts.find((part) => part.id === pattern.patternArr[0].id);
          const raw = primary?.value;
          const primaryTocId = typeof raw === "object" && raw ? (raw.to || raw.from) : undefined;
          const studentPattern = await tx.studentPattern.findUnique({ where: { studentId_patternId: { studentId, patternId: learning.pattern.id } }, select: { id: true } });
          if (!studentPattern) continue;
          await tx.studentOverallProgress.upsert({ where: { studentPatternId: studentPattern.id }, create: { studentId, patternId: learning.pattern.id, studentPatternId: studentPattern.id, trackingStatus: pattern.trackingStatus, currentValues: learning.parts, currentPrimaryTocItemId: primaryTocId }, update: { trackingStatus: pattern.trackingStatus, currentValues: learning.parts, currentPrimaryTocItemId: primaryTocId } });
        }
      };

      for (const studentId of data.studentIds) {
        /*
         * Find today's progress for this student.
         */
        const existingProgress =
          await tx.progress.findUnique({
            where: {
              studentId_date_batchId: {
                studentId,
                batchId: data.batchId,
                date: today,
              },
            },

            select: {
              id: true,
              learnings: true,
            },
          });

        /*
         * No progress exists today.
         * Create one using the same structure
         * as submitProgress().
         */
        if (!existingProgress) {
          const created =
            await tx.progress.create({
              data: {
                studentId,
                batchId: data.batchId,
                batchname: data.batchName,
                date: today,
                learnings: newLearnings,
              },
            });

          savedProgress.push(created);

          await syncOverallProgress(studentId);

          continue;
        }

        /*
         * Progress already exists.
         * Keep existing learnings and append
         * the global learnings.
         */
        const existingLearnings =
          Array.isArray(
            existingProgress.learnings
          )
            ? existingProgress.learnings
            : [];

        const updatedLearnings = [
          ...existingLearnings,
          ...newLearnings,
        ];

        const updated =
          await tx.progress.update({
            where: {
              id: existingProgress.id,
            },

            data: {
              batchname: data.batchName,
              learnings: updatedLearnings,
            },
          });

          savedProgress.push(updated);
          await syncOverallProgress(studentId);
      }

      return savedProgress;
    }
  );

  /*
   * Revalidate the progress page.
   */
  revalidatePath(
    `/Admin/branches/${data.batchId}/progress`,
    "page"
  );

  return {
    success: true,

    progressIds: results.map(
      (progress) => progress.id
    ),

    progress: results.map(
      (progress) => progress.learnings
    ),
  };
}
