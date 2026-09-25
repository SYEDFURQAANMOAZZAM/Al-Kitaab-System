
import TocCompletionClient from "./toc-completion-client";
import { requireRole } from "@/lib/auth/require-role";

export default async function subjectCompletionPage() {

  await requireRole("ADMIN");
  return (
    <div className="space-y-6 p-2 sm:p-1">
      <div>
        <h1 className="text-xl font-semibold">
          Subjects Completion
        </h1>

        <p className="text-sm text-muted-foreground">
          Student-wise subject and Subjects completion
        </p>
      </div>

      <TocCompletionClient />
    </div>
  );
}