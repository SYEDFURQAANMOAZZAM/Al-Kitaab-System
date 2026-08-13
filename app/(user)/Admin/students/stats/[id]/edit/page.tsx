import AuthVerify from "@/app/ServerActions/auth/authVerify";
import { prisma } from "@/lib/prisma";

import { updateStudent } from "@/app/ServerActions/auth/updation/updateStudent";


import UserForm from "@/components/registerComponent";

import { notFound } from "next/navigation";

type PageProps = {
  params: Promise<{
    id: string;
  }>;
};

const page = async ({ params }: PageProps) => {
  await AuthVerify("ADMIN");

  const { id } = await params;

  const [student, branches] = await Promise.all([
    prisma.student.findUnique({
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
          },
        },

        enrollments: {
          select: {
            batch: {
              select: {
                id: true,
                branchId: true,
              },
            },
          },
        },
      },
    }),

    prisma.branch.findMany({
      select: {
        id: true,
        name: true,

        batches: {
          select: {
            id: true,
            name: true,
          },
        },
      },

      orderBy: {
        name: "asc",
      },
    }),
  ]);

  if (!student) {
    notFound();
  }

  /*
   * Student's current branch.
   *
   * Assuming all selected batches belong to the same branch.
   */
  const branchId =
    student.enrollments[0]?.batch.branchId ?? "";

  /*
   * Only send batch IDs to UserForm.
   */
  const batchIds =
    student.enrollments.map(
      (enrollment) => enrollment.batch.id
    );

  /*
   * Shape the object exactly according to
   * what the form needs.
   */
  const user = {
    id: student.id,

    name: student.user.name ?? "",
    email: student.user.email ?? "",
    phone: student.user.phone ?? "",

    branchId,

    batch: batchIds,

    role: "STUDENT" as const,
  };

  return (
    <UserForm
      mode="edit"
      role="STUDENT"
      action={updateStudent.bind(null, user.id)}
      branches={branches}
      user={user}
    />
  );
};

export default page;