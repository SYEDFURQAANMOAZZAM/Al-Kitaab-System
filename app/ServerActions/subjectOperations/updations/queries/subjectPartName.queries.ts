
import { prisma } from "@/lib/prisma";

export async function updateSubjectPartNameQuery(
  subjectPartId: string,
  name: string,
) {
  return prisma.subjectPart.update({
    where: { id: subjectPartId },
    data: { name },
    select: {
      id: true,
      name: true,
      subjectId: true,
      position: true,
    },
  });
}
