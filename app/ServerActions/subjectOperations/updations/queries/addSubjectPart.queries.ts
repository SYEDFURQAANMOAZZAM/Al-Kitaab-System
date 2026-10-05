import { prisma } from "@/lib/prisma";

export async function addSubjectPartQuery(
  subjectId: string,
  name: string,
) {
  const lastPart = await prisma.subjectPart.findFirst({
    where: {
      subjectId,
    },
    orderBy: {
      position: "desc",
    },
    select: {
      position: true,
    },
  });

  const position = (lastPart?.position ?? -1) + 1;

  return prisma.subjectPart.create({
    data: {
      subjectId,
      name,
      position,
    },
    select: {
      id: true,
      name: true,
      position: true,
      subjectId: true,
    },
  });
}