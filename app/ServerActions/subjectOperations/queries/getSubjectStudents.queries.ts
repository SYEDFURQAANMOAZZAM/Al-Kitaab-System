import { prisma } from "@/lib/prisma";

export async function getSubjectStudentIds(
  subjectId: string
) {
  const studentSubjects =
    await prisma.studentSubject.findMany({
      where: {
        subjectId,
      },
      select: {
        studentId: true,
      },
    });

  return studentSubjects.map(
    (item) => item.studentId
  );
}