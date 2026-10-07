import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";

export async function updateTodayProgressLearningRemark(
  studentId: string,
  batchId: string,
  today: Date,
  learningId: string,
  remark: string | undefined,
) {
  return prisma.$transaction(async (tx) => {
    const progress = await tx.progress.findUnique({
      where: {
        studentId_date_batchId: {
          studentId,
          batchId,
          date: today,
        },
      },
      select: {
        id: true,
        learnings: true,
      },
    });

    if (!progress) {
      throw new Error("Today's progress record was not found.");
    }

    if (!Array.isArray(progress.learnings)) {
      throw new Error("The progress record has no saved learnings.");
    }

    let updated = false;
    const learnings = progress.learnings.map((entry) => {
      if (
        updated ||
        typeof entry !== "object" ||
        entry === null ||
        Array.isArray(entry) ||
        entry.learningId !== learningId
      ) {
        return entry;
      }

      updated = true;
      const learning = { ...entry };

      if (remark === undefined) {
        delete learning.remark;
      } else {
        learning.remark = remark;
      }

      return learning;
    });

    if (!updated) {
      throw new Error("The saved learning was not found.");
    }

    await tx.progress.update({
      where: { id: progress.id },
      data: {
        learnings: learnings as Prisma.InputJsonValue,
      },
    });

    return { progressId: progress.id };
  });
}
