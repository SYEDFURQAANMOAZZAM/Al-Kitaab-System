// app/(user)/Admin/study-pattern/[id]/toc/page.tsx

import { notFound } from "next/navigation";

import { prisma } from "@/lib/prisma";

import TocEditor from "./TocEditor";

export default async function TocPage({
  params,
}: {
  params: Promise<{
    id: string;
  }>;
}) {
  const { id } = await params;

  const pattern =
    await prisma.pattern.findUnique({
      where: {
        id,
      },

      select: {
        id: true,
        name: true,

        patternArr: {
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
            name: true,
            parentId: true,
            patternArrId: true,
            position: true,
          },
        },
      },
    });

  if (!pattern) {
    notFound();
  }

  return (
    <TocEditor
      pattern={pattern}
    />
  );
}