import { requireRole } from "@/lib/auth/require-role";
import { prisma } from "@/lib/prisma";
import { Status } from "@/generated/prisma/client";
import { ProgressForm } from "./ProgressForm";

const Page = async (props: {
  params: Promise<{ batchId: string }>;
}) => {
  await requireRole("ADMIN", "TEACHER");

  const { batchId } = await props.params;

  const batch = await prisma.batch.findUnique({
    where: {
      id: batchId,
    },
    select: {
      id: true,
      name: true,
      students: {
        orderBy: {
          student: {
            user: {
              name: "asc",
            },
          },
        },
        select: {
          student: {
            select: {
              id: true,
              user: {
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

  if (!batch) {
    return (
      <div className="p-6 text-center">
        Batch not found
      </div>
    );
  }

  const students = batch.students.map(
    ({ student }) => ({
      id: student.id,
      userId: student.user.id,
      name: student.user.name,
    })
  );

  return (
    <ProgressForm
      batchId={batch.id}
      batchName={batch.name}
      students={students}
      statuses={Object.values(Status)}
    />
  );
};

export default Page;