
import { prisma } from "@/lib/prisma";

export async function replaceSubjectBatchesQuery(
  subjectId: string,
  batchIds: string[],
) {
  return prisma.$transaction(async (tx) => {
    const subject = await tx.subject.findUnique({
      where: { id: subjectId },
      select: { id: true },
    });

    if (!subject) {
      throw new Error("Subject not found");
    }

    const batches = await tx.batch.findMany({
      where: {
        id: { in: batchIds },
      },
      select: { id: true },
    });

    if (batches.length !== batchIds.length) {
      throw new Error(
        "One or more selected batches do not exist",
      );
    }

    await tx.batchSubject.deleteMany({
      where: { subjectId },
    });

    if (batchIds.length > 0) {
      await tx.batchSubject.createMany({
        data: batchIds.map((batchId) => ({
          subjectId,
          batchId,
        })),
      });
    }

    return tx.batchSubject.findMany({
      where: { subjectId },
      include: {
        batch: true,
      },
    });
  });
}
