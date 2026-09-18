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

  await AuthVerify("ADMIN")

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

        teacherPatterns: {
          select: {
            patternId: true,
          },
        },
      },
    }),

    /*
     * TeacherForm needs:
     *
     * Branch
     *   └── Batch
     *        └── BatchPattern
     *             └── Pattern
     */
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

            patterns: {
              select: {
                id: true,
                batchId: true,
                patternId: true,

                pattern: {
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

  /*
   * Make sure the teacher exists and the linked user
   * is actually a TEACHER.
   */
  if (!teacher || teacher.user.role !== "TEACHER") {
    notFound();
  }

  /*
   * TeacherAssignment is the source of truth for batches.
   */
  const batchIds = teacher.assignments.map(
    (assignment) => assignment.batchId
  );

  /*
   * Branches are NOT directly assigned to teachers.
   *
   * They are derived from the assigned batches:
   *
   * Teacher
   *   -> TeacherAssignment
   *      -> Batch
   *         -> Branch
   */
  const branchIds = [
    ...new Set(
      teacher.assignments
        .map((assignment) => assignment.batch.branchId)
        .filter(Boolean)
    ),
  ];

  /*
   * TeacherPattern is the source of truth for teacher patterns.
   */
  const patternIds = teacher.teacherPatterns.map(
    (teacherPattern) => teacherPattern.patternId
  );

  /*
   * updateTeacher expects:
   *
   * updateTeacher(userId, prevState, formData)
   *
   * Bind the User ID so TeacherForm only submits
   * prevState and FormData.
   */
  const boundUpdateTeacher = updateTeacher.bind(
    null,
    teacher.user.id
  );

  return (
    <Suspense fallback={<div>Loading...</div>}>
      <TeacherForm
        mode="edit"
        editorRole="ADMIN"
        action={boundUpdateTeacher}
        branches={branches}
        user={{
          id: teacher.user.id,

          name: teacher.user.name,
          email: teacher.user.email,
          phone: teacher.user.phone,

          branchIds,
          batchIds,
          patternIds,
        }}
      />
    </Suspense>
  );
}
