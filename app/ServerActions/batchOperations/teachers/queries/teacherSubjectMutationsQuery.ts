
import { prisma } from "@/lib/prisma";

export async function addSubjectToTeacherQuery(
  teacherId: string,
  batchId: string,
  subjectId: string,
) {
  return prisma.$transaction(async (tx) => {
    const [teacher, batch, batchSubject] = await Promise.all([
      tx.teacher.findUnique({ where: { id: teacherId }, select: { id: true } }),
      tx.batch.findUnique({ where: { id: batchId }, select: { id: true } }),
      tx.batchSubject.findUnique({
        where: { batchId_subjectId: { batchId, subjectId } },
        select: { id: true },
      }),
    ]);
    if (!teacher) throw new Error("Teacher not found.");
    if (!batch) throw new Error("Batch not found.");
    if (!batchSubject) throw new Error("Subject does not belong to this batch.");
    const assignment = await tx.teacherSubject.createMany({
      data: [{ teacherId, subjectId }],
      skipDuplicates: true,
    });
    if (assignment.count === 0) throw new Error("Teacher is already assigned to this subject.");
    return assignment;
  });
}

export async function deleteSubjectFromTeacherQuery(
  teacherId: string,
  batchId: string,
  subjectId: string,
) {
  const batchSubject = await prisma.batchSubject.findUnique({
    where: { batchId_subjectId: { batchId, subjectId } },
    select: { id: true },
  });
  if (!batchSubject) throw new Error("Subject does not belong to this batch.");
  return prisma.teacherSubject.deleteMany({
    where: { teacherId, subjectId },
  });
}
