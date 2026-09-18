import { notFound } from "next/navigation";
import { Suspense } from "react";

import AuthVerify from "@/app/ServerActions/auth/authVerify";
import { prisma } from "@/lib/prisma";
import { updateStudent } from "@/app/ServerActions/updation/updateStudent";

import UserForm from "@/components/UserForm";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function Page({ params }: PageProps) {
  const { id } = await params;

  // Both ADMIN and TEACHER may reach this route. `session.role` is the
  // real, authenticated actor role — this is what drives `editorRole`,
  // never anything from the client.
  const session = await AuthVerify("ADMIN", "TEACHER","STUDENT");

  const [student, branches] = await Promise.all([
    prisma.student.findUnique({
      where: { id: id },
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
          select: { batchId: true },
        },

        studentPatterns: {
          select: { patternId: true },
        },
      },
    }),

    prisma.branch.findMany({
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        batches: {
          orderBy: { name: "asc" },
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
                  select: { id: true, name: true },
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

  // `updateStudent(userId, prevState, formData)` — bind the id so the
  // form can still call it as `(prevState, formData) => ...`.
  const boundUpdateStudent = updateStudent.bind(null, student.user.id);

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
          batchIds: student.enrollments.map((e) => e.batchId),
          patternIds: student.studentPatterns.map((sp) => sp.patternId),
        }}
      />
    </Suspense>
  );
}