import { notFound } from "next/navigation";
import { Suspense } from "react";

import AuthVerify from "@/app/ServerActions/auth/authVerify";
import { prisma } from "@/lib/prisma";
import { updateStudent } from "@/app/ServerActions/updation/updateStudent";

import UserForm from "@/components/UserForm";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function Page({
  params,
}: PageProps) {
  const { id } = await params;

  // The authenticated session role determines the editor role.
  const session = await AuthVerify(
    "ADMIN",
    "TEACHER",
    "STUDENT"
  );

  const [student, branches] = await Promise.all([
    prisma.student.findUnique({
      where: {
        id,
      },

      select: {
        fatherName: true,
        Adress: true,

        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            phone2: true,
            role: true,
          },
        },

        enrollments: {
          select: {
            batchId: true,
          },
        },

        studentSubjects: {
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

  if (
    !student ||
    student.user.role !== "STUDENT"
  ) {
    notFound();
  }

  /*
   * updateStudent expects:
   *
   * updateStudent(userId, prevState, formData)
   *
   * Bind the user ID so UserForm only submits
   * prevState and FormData.
   */
  const boundUpdateStudent =
    updateStudent.bind(
      null,
      student.user.id
    );

  return (
    <Suspense
      fallback={
        <div>Loading...</div>
      }
    >
      <UserForm
        mode="edit"
        editorRole={session.role}
        action={boundUpdateStudent}
        branches={branches}
        user={{
          id: student.user.id,
          name: student.user.name,
          email: student.user.email,
          phone: student.user.phone,
          phone2: student.user.phone2,
          fatherName: student.fatherName,
          address: student.Adress,

          batchIds:
            student.enrollments.map(
              (enrollment) =>
                enrollment.batchId
            ),

          subjectIds:
            student.studentSubjects.map(
              (studentSubject) =>
                studentSubject.subjectId
            ),
        }}
      />
    </Suspense>
  );
}