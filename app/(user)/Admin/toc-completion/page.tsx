import { getTocCompletionReport } from "./get-toc-completion-report";
import TocCompletionClient from "./toc-completion-client";

export default async function TocCompletionPage() {
  const students = await getTocCompletionReport();

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <div>
        <h1 className="text-xl font-semibold">
          TOC Completion
        </h1>

        <p className="text-sm text-muted-foreground">
          Student-wise subject and TOC completion
        </p>
      </div>

      <TocCompletionClient
        students={students}
      />
    </div>
  );
}