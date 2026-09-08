import AuthVerify from "@/app/ServerActions/auth/authVerify";
import { prisma } from "@/lib/prisma";
import SignupForm from "./registercomponent";
import { Suspense } from "react";

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
});
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <SignupForm branches={branches} />
    </Suspense>
  );
}

