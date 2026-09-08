import { notFound } from "next/navigation";

import { prisma } from "@/lib/prisma";
import { getBranchesWithBatches } from "@/app/ServerActions/getGroups/getBranchesAndBatchesforRegister";
import { updateStudent } from "@/app/ServerActions/updation/updateStudent";

import UserForm from "./registerComponentStudent";

type PageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function Page({
  params,
}: PageProps) {
  const { id } = await params;

  const [student, branches] = await Promise.all([
    prisma.student.findUnique({
      where: {
        id,
      },
      include: {
        user: true,

        enrollments: {
          select: {
            batchId: true,
          },
        },

        studentPatterns: {
          select: {
            patternId: true,
          },
        },
      },
    }),

    getBranchesWithBatches(),
  ]);

  if (!student || student.user.role !== "STUDENT") {
    console.log("Student not found:", id);
    notFound();
  }

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-10">
      <UserForm
        mode="edit"
        role="STUDENT"
        action={updateStudent.bind(
          null,
          student.user.id
        )}
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

          patternIds: student.studentPatterns.map(
            (pattern) => pattern.patternId
          ),

          role: "STUDENT",
        }}
      />
    </div>
  );
}