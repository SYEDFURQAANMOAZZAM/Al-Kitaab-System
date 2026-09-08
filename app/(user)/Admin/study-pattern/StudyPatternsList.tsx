import { BookOpen } from "lucide-react";
import { StudyPatternRow } from "./StudyPatternRow";

type Pattern = {
  id: string;
  name: string;

  patternArr: {
    id: string;
    name: string;
    position: number;
  }[];

  _count: {
    batches: number;
  };
};

type StudyPatternsListProps = {
  patterns: Pattern[];
};

export function StudyPatternsList({
  patterns,
}: StudyPatternsListProps) {
  if (patterns.length === 0) {
    return (
      <section className="overflow-hidden rounded-xl border bg-card shadow-sm">
        <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-muted">
            <BookOpen className="h-5 w-5 text-muted-foreground" />
          </div>

          <h2 className="mt-4 font-semibold text-foreground">
            No study patterns yet
          </h2>

          <p className="mt-1 max-w-sm text-sm text-muted-foreground">
            Create your first study pattern to start
            managing reusable study structures.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="overflow-visible rounded-xl border bg-card shadow-sm">
      {/* =====================================================
          LIST HEADER
      ===================================================== */}

      <div className="border-b px-5 py-4 sm:px-6">
        <h2 className="font-semibold text-foreground">
          All Patterns
        </h2>

        <p className="mt-1 text-sm text-muted-foreground">
          {patterns.length}{" "}
          {patterns.length === 1
            ? "pattern"
            : "patterns"}{" "}
          available
        </p>
      </div>

      {/* =====================================================
          DESKTOP COLUMN HEADER
      ===================================================== */}

      <div
        className="
          hidden
          grid-cols-[minmax(180px,1fr)_minmax(300px,2fr)_130px_64px]
          items-center
          gap-4
          border-b
          bg-muted/50
          px-5
          py-3
          text-xs
          font-medium
          uppercase
          tracking-wide
          text-muted-foreground
          md:grid
          lg:px-6
        "
      >
        <div>Pattern Name</div>
        <div>Pattern</div>
        <div>Batches</div>
        <div className="text-right">Actions</div>
      </div>

      {/* =====================================================
          ROWS
      ===================================================== */}

      <div>
        {patterns.map((pattern) => (
          <StudyPatternRow
            key={pattern.id}
            pattern={pattern}
          />
        ))}
      </div>
    </section>
  );
}