import { notFound } from "next/navigation";
import { Suspense } from "react";

import AuthVerify from "@/app/ServerActions/auth/authVerify";
import { prisma } from "@/lib/prisma";
import { updateTeacher } from "@/app/ServerActions/updation/updateTeacher";

import TeacherForm from "@/components/teacherForm";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function Page({ params }: PageProps) {
  const { id } = await params;

  const session = await AuthVerify("ADMIN", "TEACHER");

  if (session.role !== "ADMIN" && session.role !== "TEACHER") {
    notFound();
  }

  const [teacher, branches] = await Promise.all([
    prisma.teacher.findUnique({
      where: {
        id,
      },

      select: {
        id: true,

        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            role: true,
          },
        },

        assignments: {
          select: {
            batchId: true,

            batch: {
              select: {
                id: true,
                branchId: true,
              },
            },
          },
        },

        teacherSubjects: {
          select: {
            subjectId: true,
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
            branchId: true,

            subjects: {
              select: {
                id: true,
                batchId: true,
                subjectId: true,

                subject: {
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
    }),
  ]);

  if (!teacher || teacher.user.role !== "TEACHER") {
    notFound();
  }

  const batchIds = teacher.assignments.map(
    (assignment) => assignment.batchId,
  );

  const branchIds = [
    ...new Set(
      teacher.assignments
        .map((assignment) => assignment.batch.branchId)
        .filter((branchId): branchId is string => Boolean(branchId)),
    ),
  ];

  const subjectIds = teacher.teacherSubjects.map(
    (teacherSubject) => teacherSubject.subjectId,
  );

  const boundUpdateTeacher = updateTeacher.bind(
    null,
    teacher.id,
  );

  return (
    <Suspense fallback={<div>Loading...</div>}>
      <TeacherForm
        mode="edit"
        editorRole={session.role}
        action={boundUpdateTeacher}
        branches={branches}
        user={{
          id: teacher.user.id,
          name: teacher.user.name,
          email: teacher.user.email,
          phone: teacher.user.phone,
          branchIds,
          batchIds,
          subjectIds,
        }}
      />
    </Suspense>
  );
}