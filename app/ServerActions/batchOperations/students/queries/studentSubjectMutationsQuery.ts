
import { prisma } from "@/lib/prisma";

export async function addSubjectToStudentQuery(
  studentId: string,
  subjectId: string
): Promise<boolean> {
  return prisma.$transaction(async (tx) => {
    const [student, subject] = await Promise.all([
      tx.student.findUnique({
        where: { id: studentId },
        select: { id: true },
      }),
      tx.subject.findUnique({
        where: { id: subjectId },
        select: { id: true },
      }),
    ]);

    if (!student) throw new Error("Student not found");
    if (!subject) throw new Error("Subject not found");

    const result = await tx.studentSubject.createMany({
      data: [{ studentId, subjectId }],
      skipDuplicates: true,
    });

    return result.count > 0;
  });
}

export async function deleteSubjectFromStudentQuery(
  studentId: string,
  subjectId: string
): Promise<boolean> {
  const result = await prisma.studentSubject.deleteMany({
    where: { studentId, subjectId },
  });

  return result.count > 0;
}
