import AuthVerify from "@/app/ServerActions/auth/authVerify";
import { prisma } from "@/lib/prisma";

import { updateTeacher } from "@/app/ServerActions/updation/updateTeacher";


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
          },
        },

        assignments: {
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

  if (!teacher) {
    notFound();
  }

  /*
   * teacher's current branch.
   *
   * Assuming all selected batches belong to the same branch.
   */
  const branchId =
    teacher.assignments[0]?.batch.branchId ?? "";

  /*
   * Only send batch IDs to UserForm.
   */
  const batchIds =
    teacher.assignments.map(
      (assignment) => assignment.batch.id
    );

  /*
   * Shape the object exactly according to
   * what the form needs.
   */
  const user = {
    id: teacher.id,

    name: teacher.user.name ?? "",
    email: teacher.user.email ?? "",
    phone: teacher.user.phone ?? "",

    branchId,

    batch: batchIds,

    role: "TEACHER" as const,
  };

  return (
    <UserForm
      mode="edit"
      role="TEACHER"
      action={updateTeacher.bind(null, user.id)}
      branches={branches}
      user={user}
    />
  );
};

export default page;