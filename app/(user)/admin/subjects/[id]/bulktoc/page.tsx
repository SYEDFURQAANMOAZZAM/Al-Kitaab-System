import { notFound } from "next/navigation";

import { prisma } from "@/lib/prisma";

import BulkTocEditor from "./bulk-toc-editor";

type PageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function BulkTocPage({
  params,
}: PageProps) {
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

      _count: {
        select: {
          tocItems: true,
        },
      },
    },
  });

  if (!subject) {
    notFound();
  }

  return (
    <BulkTocEditor subject={subject} />
  );
}