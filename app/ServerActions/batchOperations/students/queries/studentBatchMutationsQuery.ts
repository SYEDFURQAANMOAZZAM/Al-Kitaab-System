
import { prisma } from "@/lib/prisma";

export async function addStudentToBatchQuery(
  studentId: string,
  batchId: string
): Promise<boolean> {
  return prisma.$transaction(async (tx) => {
    const [student, batch] = await Promise.all([
      tx.student.findUnique({
        where: { id: studentId },
        select: { id: true },
      }),
      tx.batch.findUnique({
        where: { id: batchId },
        select: { id: true },
      }),
    ]);

    if (!student) throw new Error("Student not found");
    if (!batch) throw new Error("Batch not found");

    const result = await tx.studentEnrollment.createMany({
      data: [{ studentId, batchId }],
      skipDuplicates: true,
    });

    return result.count > 0;
  });
}

export async function removeStudentFromBatchQuery(
  studentId: string,
  batchId: string
): Promise<boolean> {
  const result = await prisma.studentEnrollment.deleteMany({
    where: { studentId, batchId },
  });

  return result.count > 0;
}

export async function replaceStudentBatchEnrollmentQuery(
  studentId: string,
  currentBatchId: string,
  newBatchId: string
): Promise<void> {
  if (currentBatchId === newBatchId) {
    throw new Error("Student is already in this batch");
  }

  await prisma.$transaction(async (tx) => {
    const current = await tx.studentEnrollment.findUnique({
      where: {
        studentId_batchId: {
          studentId,
          batchId: currentBatchId,
        },
      },
      select: { id: true },
    });

    if (!current) {
      throw new Error("Current student enrollment not found");
    }

    const destination = await tx.batch.findUnique({
      where: { id: newBatchId },
      select: { id: true },
    });

    if (!destination) {
      throw new Error("Destination batch not found");
    }

    const existing = await tx.studentEnrollment.findUnique({
      where: {
        studentId_batchId: {
          studentId,
          batchId: newBatchId,
        },
      },
      select: { id: true },
    });

    if (existing) {
      throw new Error("Student is already enrolled in destination batch");
    }

    await tx.studentEnrollment.delete({
      where: { id: current.id },
    });

    await tx.studentEnrollment.create({
      data: { studentId, batchId: newBatchId },
    });
  });
}
