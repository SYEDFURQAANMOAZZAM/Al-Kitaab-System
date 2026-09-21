import { notFound } from "next/navigation";

import { prisma } from "@/lib/prisma";

import TocEditor from "./toc-editor";

export default async function SubjectTocPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const subject = await prisma.subject.findUnique({
    where: {
      id,
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
        orderBy: [
          {
            position: "asc",
          },
        ],

        select: {
          id: true,
          name: true,
          parentId: true,
          subjectPartId: true,
          position: true,
        },
      },
    },
  });

  if (!subject) {
    notFound();
  }

  return (
    <TocEditor
      subject={subject}
    />
  );
}