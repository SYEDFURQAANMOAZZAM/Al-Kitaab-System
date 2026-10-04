
import { prisma } from "@/lib/prisma";

export async function addTeacherToBatchQuery(
  teacherId: string,
  batchId: string,
) {
  return prisma.teacherAssignment.createMany({
    data: [{ teacherId, batchId }],
    skipDuplicates: true,
  });
}

export async function removeTeacherFromBatchQuery(
  teacherId: string,
  batchId: string,
) {
  return prisma.teacherAssignment.deleteMany({
    where: { teacherId, batchId },
  });
}

export async function replaceTeacherBatchAssignmentQuery(
  teacherId: string,
  currentBatchId: string,
  newBatchId: string,
) {
  return prisma.$transaction(async (tx) => {
    const [teacher, currentBatch, newBatch] = await Promise.all([
      tx.teacher.findUnique({
        where: { id: teacherId },
        select: { id: true },
      }),
      tx.batch.findUnique({
        where: { id: currentBatchId },
        select: { id: true },
      }),
      tx.batch.findUnique({
        where: { id: newBatchId },
        select: { id: true },
      }),
    ]);

    if (!teacher) throw new Error("Teacher not found.");
    if (!currentBatch) throw new Error("Current batch not found.");
    if (!newBatch) throw new Error("Destination batch not found.");

    const currentAssignment =
      await tx.teacherAssignment.findUnique({
        where: {
          teacherId_batchId: {
            teacherId,
            batchId: currentBatchId,
          },
        },
        select: { id: true },
      });

    if (!currentAssignment) {
      throw new Error("Teacher is not assigned to the current batch.");
    }

    if (currentBatchId === newBatchId) {
      throw new Error("Teacher is already assigned to this batch.");
    }

    const existingDestination =
      await tx.teacherAssignment.findUnique({
        where: {
          teacherId_batchId: {
            teacherId,
            batchId: newBatchId,
          },
        },
        select: { id: true },
      });

    if (existingDestination) {
      throw new Error("Teacher is already assigned to the destination batch.");
    }

    await tx.teacherAssignment.delete({
      where: { id: currentAssignment.id },
    });

    return tx.teacherAssignment.create({
      data: {
        teacherId,
        batchId: newBatchId,
      },
      select: {
        id: true,
        teacherId: true,
        batchId: true,
      },
    });
  });
}
