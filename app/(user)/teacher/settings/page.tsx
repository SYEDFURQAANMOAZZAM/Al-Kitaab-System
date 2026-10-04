
import { notFound } from "next/navigation";

import AuthVerify from "@/app/ServerActions/auth/authVerify";
import { prisma } from "@/lib/prisma";
import AcademyBackup from "./AcademyBackup";

export default async function Page() {
  const session = await AuthVerify("TEACHER");

  const teacher = await prisma.teacher.findUnique({
    where: {
      userId: session.id,
    },
    select: {
      id: true,
      assignments: {
        select: {
          batchId: true,
          batch: {
            select: {
              students: {
                select: {
                  studentId: true,
                },
              },
            },
          },
        },
      },
    },
  });

  if (!teacher) {
    notFound();
  }

  // Only batches assigned to this teacher.
  const batchIds = [
    ...new Set(
      teacher.assignments.map((assignment) => assignment.batchId),
    ),
  ];

  // Only students enrolled in the teacher's assigned batches.
  // Deduplicate students who are enrolled in multiple assigned batches.
  const studentIds = [
    ...new Set(
      teacher.assignments.flatMap((assignment) =>
        assignment.batch.students.map((student) => student.studentId),
      ),
    ),
  ];

  return (
    <main className="mx-auto w-full max-w-5xl p-3 sm:p-5">
      <div className="mb-5">
        <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">
          My Backups
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Export monthly attendance and student progress reports for your
          assigned batches.
        </p>
      </div>

      <AcademyBackup
        batchIds={batchIds}
        studentIds={studentIds}
      />
    </main>
  );
}
