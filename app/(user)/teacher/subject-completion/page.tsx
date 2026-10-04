
import TeacherTocCompletionClient from "./teacher-toc-completion-client";
import { requireRole } from "@/lib/auth/require-role";

export default async function TeacherSubjectCompletionPage() {
  await requireRole("TEACHER");

  return (
    <div className="space-y-6 p-2 sm:p-1">
      <div>
        <h1 className="text-xl font-semibold">
          Subjects Completion
        </h1>

        <p className="text-sm text-muted-foreground">
          Track your students progress across your assigned subjects.
        </p>
      </div>

      <TeacherTocCompletionClient />
    </div>
  );
}
