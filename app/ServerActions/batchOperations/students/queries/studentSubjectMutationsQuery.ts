import { prisma } from "@/lib/prisma";

export async function addSubjectToStudentQuery(
  studentId: string,
  batchId: string,
  subjectId: string
): Promise<boolean> {
  return prisma.$transaction(async (tx) => {
    const [student, batch, enrollment, batchSubject] = await Promise.all([
      tx.student.findUnique({ where: { id: studentId }, select: { id: true } }),
      tx.batch.findUnique({ where: { id: batchId }, select: { id: true } }),
      tx.studentEnrollment.findUnique({
        where: { studentId_batchId: { studentId, batchId } },
        select: { id: true },
      }),
      tx.batchSubject.findUnique({
        where: { batchId_subjectId: { batchId, subjectId } },
        select: { id: true },
      }),
    ]);

    if (!student) throw new Error("Student not found.");
    if (!batch) throw new Error("Batch not found.");
    if (!enrollment) throw new Error("Student is not enrolled in this batch.");
    if (!batchSubject) throw new Error("Subject does not belong to this batch.");

    const result = await tx.studentSubject.createMany({
      data: [{ studentId, subjectId }],
      skipDuplicates: true,
    });

    return result.count > 0;
  });
}

export async function deleteSubjectFromStudentQuery(
  studentId: string,
  batchId: string,
  subjectId: string
): Promise<boolean> {
  const [enrollment, batchSubject] = await Promise.all([
    prisma.studentEnrollment.findUnique({
      where: { studentId_batchId: { studentId, batchId } },
      select: { id: true },
    }),
    prisma.batchSubject.findUnique({
      where: { batchId_subjectId: { batchId, subjectId } },
      select: { id: true },
    }),
  ]);
  if (!enrollment) throw new Error("Student is not enrolled in this batch.");
  if (!batchSubject) throw new Error("Subject does not belong to this batch.");

  const result = await prisma.studentSubject.deleteMany({
    where: { studentId, subjectId },
  });

  return result.count > 0;
}
