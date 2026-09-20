import { prisma } from "@/lib/prisma";

import { AddSubject } from "@/components/AddSubject";

export default async function Page() {
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
        },
      },
    },
  });

  return (
    <main className="p-2">
      <AddSubject branches={branches} />
    </main>
  );
}