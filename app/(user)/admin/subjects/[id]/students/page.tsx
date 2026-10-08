import Link from "next/link";
import { notFound } from "next/navigation";

import SubjectStudentCompletionClient from "./subject-student-completion-client";

import { getSubjectForViewToc } from "@/app/ServerActions/subjectOperations/queries/getSubject.queries";
import { getSubjectStudentIds } from "@/app/ServerActions/subjectOperations/queries/getSubjectStudents.queries";

import { requireRoleForAction } from "@/lib/auth/require-role";

type Props = {
  params: Promise<{
    id: string;
  }>;
};

export default async function SubjectStudentsPage({
  params,
}: Props) {
  await requireRoleForAction(["ADMIN"]);

  const { id: subjectId } = await params;

  /*
   * One query for all students associated
   * with this subject.
   */
  const [subject, studentIds] =
    await Promise.all([
      getSubjectForViewToc(subjectId),
      getSubjectStudentIds(subjectId),
    ]);

  if (!subject) {
    notFound();
  }

  return (
    <main className="mx-auto w-full space-y-6 p-2 sm:p-6">
      <div className="space-y-2">
        <Link
          href={`/admin/subjects/${subjectId}`}
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          ← Back to Subjects
        </Link>

        <h1 className="text-2xl font-semibold tracking-tight">
          Students Completion
        </h1>

        <p className="text-sm text-muted-foreground">
          View student completion for{" "}
          <span className="font-medium text-foreground">
            {subject.name}
          </span>
          .
        </p>
      </div>

      <div className="rounded-xl border bg-card p-4 sm:p-6">
        <SubjectStudentCompletionClient
          subjectId={subjectId}
          studentIds={studentIds}
        />
      </div>
    </main>
  );
}