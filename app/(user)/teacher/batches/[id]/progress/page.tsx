import { notFound } from "next/navigation";

import { prisma } from "@/lib/prisma";
import { requireTeacherBatchAccess } from "@/lib/auth/require-teacher-batch";
import { ProgressForm } from "@/components/ProgressForm";

type PageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function ProgressPage({
  params,
}: PageProps) {
  const { id } = await params;

  await requireTeacherBatchAccess(id);

  const batch = await prisma.batch.findUnique({
    where: {
      id,
    },
    select: {
      id: true,
      name: true,
      students: {
        orderBy: {
          student: {
            user: {
              name: "asc",
            },
          },
        },
        select: {
          student: {
            select: {
              id: true,
              user: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
        },
      },
    },
  });

  if (!batch) {
    notFound();
  }

  const students = batch.students.map(({ student }) => ({
    id: student.id,
    userId: student.user.id,
    name: student.user.name,
  }));

  return (
    <ProgressForm
      batchId={batch.id}
      batchName={batch.name}
      students={students}
    />
  );
}