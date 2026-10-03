
import { prisma } from "@/lib/prisma";

export async function updateSubjectNameQuery(
  subjectId: string,
  name: string,
) {
  return prisma.subject.update({
    where: { id: subjectId },
    data: { name },
    select: {
      id: true,
      name: true,
    },
  });
}
