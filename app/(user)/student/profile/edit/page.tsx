
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { requireRole } from "@/lib/auth/require-role";
import { prisma } from "@/lib/prisma";
import { updateStudent } from "@/app/ServerActions/studentOperations/updateStudent";
import UserForm from "@/components/UserForm";

export default async function EditStudentProfilePage() {
  const session = await requireRole("STUDENT");

  const [student, branches] = await Promise.all([
    prisma.student.findUnique({
      where: {
        userId: session.id,
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

  if (!student || student.user.role !== "STUDENT") {
    notFound();
  }

  // Bind the authenticated student's user ID.
  const boundUpdateStudent = updateStudent.bind(
    null,
    student.user.id
  );

  return (
    <Suspense fallback={<div>Loading...</div>}>
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

          batchIds: student.enrollments.map(
            (enrollment) => enrollment.batchId
          ),

          subjectIds: student.studentSubjects.map(
            (studentSubject) => studentSubject.subjectId
          ),
        }}
      />
    </Suspense>
  );
}
