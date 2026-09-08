import Link from "next/link";
import { getPatterns } from "@/app/ServerActions/patternOperations/fetchPatterns";
import { StudyPatternsList } from "./StudyPatternsList";

export default async function Page() {
  const result = await getPatterns();

  if (!result.success) {
    return (
      <div className="p-6 text-sm text-destructive">
        {result.error}
      </div>
    );
  }

  return (
    <main className="space-y-8 p-2 sm:p-2 lg:p-2">
      {/* =====================================================
          PAGE HEADER
      ===================================================== */}

      <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>Admin</span>
            <span>/</span>
            <span>Study Patterns</span>
          </div>

          <h1 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">
            Study Patterns
          </h1>

          <p className="mt-1 text-sm text-muted-foreground sm:text-base">
            Create and manage study patterns for your batches.
          </p>
        </div>

        <Link
          href="/Admin/study-pattern/add"
          className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground shadow-sm transition hover:opacity-90"
        >
          <span className="text-lg leading-none">+</span>
          Add Pattern
        </Link>
      </div>

      {/* =====================================================
          PATTERNS
      ===================================================== */}

      <StudyPatternsList patterns={result.patterns} />
    </main>
  );
}