
import { prisma } from "@/lib/prisma";

export async function addSubjectToTeacherQuery(
  teacherId: string,
  subjectId: string,
) {
  return prisma.teacherSubject.createMany({
    data: [{ teacherId, subjectId }],
    skipDuplicates: true,
  });
}

export async function deleteSubjectFromTeacherQuery(
  teacherId: string,
  subjectId: string,
) {
  return prisma.teacherSubject.deleteMany({
    where: { teacherId, subjectId },
  });
}
