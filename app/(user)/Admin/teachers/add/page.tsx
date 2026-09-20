import { Suspense } from "react";

import AuthVerify from "@/app/ServerActions/auth/authVerify";
import { prisma } from "@/lib/prisma";
import { registerTeacher } from "@/app/ServerActions/registeration/registerTeacher";

import TeacherForm from "@/components/teacherForm";

export default async function Page() {
  await AuthVerify("ADMIN");

  const branches = await prisma.branch.findMany({
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
  });

  return (
    <Suspense fallback={<div>Loading...</div>}>
      <TeacherForm
        mode="create"
        editorRole="ADMIN"
        action={registerTeacher}
        branches={branches}
      />
    </Suspense>
  );
}