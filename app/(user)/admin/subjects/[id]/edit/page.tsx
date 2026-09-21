import { notFound } from "next/navigation";

import { prisma } from "@/lib/prisma";

import { AddSubject } from "@/components/AddSubject";

type PageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function Page({
  params,
}: PageProps) {
  const { id } = await params;

  const [subject, branches] = await Promise.all([
    prisma.subject.findUnique({
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

        batches: {
          select: {
            batchId: true,
          },
        },

        trackingTerms: {
          orderBy: {
            position: "asc",
          },
          select: {
            id: true,
            name: true,
            position: true,
          },
        },
      },
    }),

    prisma.branch.findMany({
      orderBy: {
        name: "asc",
      },
      select: {
        id: true,
        name: true,

        batches: {
          orderBy: {
            name: "asc",
          },
          select: {
            id: true,
            name: true,
          },
        },
      },
    }),
  ]);

  if (!subject) {
    notFound();
  }

  return (
    <main className="p-2">
      <AddSubject
        branches={branches}
        subject={subject}
      />
    </main>
  );
}