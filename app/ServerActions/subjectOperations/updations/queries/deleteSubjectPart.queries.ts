
import { prisma } from "@/lib/prisma";

export async function deleteSubjectPartQuery(
  subjectPartId: string,
) {
  return prisma.subjectPart.delete({
    where: { id: subjectPartId },
    select: {
      id: true,
      name: true,
      subjectId: true,
    },
  });
}
