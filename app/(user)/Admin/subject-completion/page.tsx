
import TocCompletionClient from "./toc-completion-client";

export default async function subjectCompletionPage() {

  return (
    <div className="space-y-6 p-4 sm:p-6">
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