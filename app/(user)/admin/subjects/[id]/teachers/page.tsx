import Link from "next/link";
import { notFound } from "next/navigation";

import { prisma } from "@/lib/prisma";
import { requireRoleForAction } from "@/lib/auth/require-role";

type Props = {
  params: Promise<{
    id: string;
  }>;
};

export default async function SubjectTeachersPage({
  params,
}: Props) {
  await requireRoleForAction(["ADMIN"]);

  const { id: subjectId } = await params;

  const subject = await prisma.subject.findUnique({
    where: {
      id: subjectId,
    },
    select: {
      id: true,
      name: true,

      teacherSubjects: {
        orderBy: {
          teacher: {
            user: {
              name: "asc",
            },
          },
        },

        select: {
          teacher: {
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
            },
          },
        },
      },
    },
  });

  if (!subject) {
    notFound();
  }

  return (
    <main className="mx-auto w-full space-y-6 p-2 sm:p-6">
      {/* Header */}
      <div className="space-y-2">
        <Link
          href={`/admin/subjects/${subject.id}`}
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          ← Back to Subjects
        </Link>

        <h1 className="text-2xl font-semibold tracking-tight">
          Subject Teachers
        </h1>

        <p className="text-sm text-muted-foreground">
          Teachers associated with{" "}
          <span className="font-medium text-foreground">
            {subject.name}
          </span>
          .
        </p>
      </div>

      {/* Teachers */}
      <div className="rounded-xl border bg-card">
        <div className="border-b px-4 py-4 sm:px-6">
          <div className="text-sm font-medium">
            Teachers
          </div>

          <div className="text-xs text-muted-foreground">
            {subject.teacherSubjects.length}{" "}
            {subject.teacherSubjects.length === 1
              ? "teacher"
              : "teachers"}
          </div>
        </div>

        {subject.teacherSubjects.length > 0 ? (
          <div className="divide-y">
            {subject.teacherSubjects.map(
              ({ teacher }) => (
                <div
                  key={teacher.id}
                  className="flex flex-col gap-1 px-4 py-4 sm:px-6"
                >
                  <div className="font-medium">
                    {teacher.user.name}
                  </div>

                  <div className="text-sm text-muted-foreground">
                    {teacher.user.email}
                  </div>

                  {teacher.user.phone && (
                    <div className="text-sm text-muted-foreground">
                      {teacher.user.phone}
                    </div>
                  )}
                </div>
              )
            )}
          </div>
        ) : (
          <div className="px-4 py-8 text-center text-sm text-muted-foreground sm:px-6">
            No teachers are associated with this
            subject.
          </div>
        )}
      </div>
    </main>
  );
}