import AuthVerify from "@/app/ServerActions/auth/authVerify";
import { prisma } from "@/lib/prisma";
import { Suspense } from "react";

import UserForm from "@/components/UserForm";
import { createStudent } from "@/app/ServerActions/registeration/registerStudent";

export default async function Page() {
  await AuthVerify("ADMIN");

  const branches = await prisma.branch.findMany({
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
          subjects: {
            select: {
              id: true,
              batchId: true,
              subjectId: true,
              subject: {
                select: { id: true, name: true },
              },
            },
          },
        },
      },
    },
  });

  return (
    <Suspense fallback={<div>Loading...</div>}>
      <UserForm
        mode="create"
        editorRole="ADMIN"
        action={createStudent}
        branches={branches}
      />
    </Suspense>
  );
}