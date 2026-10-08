import { prisma } from "@/lib/prisma";

export async function getSubjectForViewToc(
  subjectId: string
) {
  return prisma.subject.findUnique({
    where: {
      id: subjectId,
    },
    select: {
      id: true,
      name: true,

      parts: {
        orderBy: {
          position: "asc",
        },
        select: {
          id: true,
          name: true,
          position: true,
        },
      },

      tocItems: {
        orderBy: {
          position: "asc",
        },
        select: {
          id: true,
          subjectPartId: true,
          parentId: true,
          name: true,
          position: true,
        },
      },
    },
  });
}