import AuthVerify from "@/app/ServerActions/auth/authVerify";
import { prisma } from "@/lib/prisma";

import { updateTeacher } from "@/app/ServerActions/updation/updateTeacher";

import UserForm from "./registerTeacherComponent";

import { notFound } from "next/navigation";

type PageProps = {
  params: Promise<{
    id: string;
  }>;
};

const Page = async ({ params }: PageProps) => {
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
            branchId: true,
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

  /* ---------------------------------------------
     GET ASSIGNED BATCH IDS
  --------------------------------------------- */

  const batchIds = teacher.assignments.map(
    (assignment) => assignment.batch.id
  );

  /* ---------------------------------------------
     GET BRANCH IDS FROM ASSIGNED BATCHES
  --------------------------------------------- */

  const branchIds = [
    ...new Set(
      teacher.assignments.map(
        (assignment) => assignment.batch.branchId
      )
    ),
  ];

  /* ---------------------------------------------
     FORM USER
  --------------------------------------------- */

  const user = {
    id: teacher.id,

    name: teacher.user.name ?? "",
    email: teacher.user.email ?? "",
    phone: teacher.user.phone ?? "",

    branchIds,
    batchIds,

    role: "TEACHER" as const,
  };

  return (
    <UserForm
      mode="edit"
      role="TEACHER"
      action={updateTeacher.bind(null, teacher.id)}
      branches={branches}
      user={user}
    />
  );
};

export default Page;