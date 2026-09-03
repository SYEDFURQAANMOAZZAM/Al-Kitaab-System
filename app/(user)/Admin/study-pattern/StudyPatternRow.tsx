import { PatternActions } from "./PatternActions";

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

type StudyPatternRowProps = {
  pattern: Pattern;
};

export function StudyPatternRow({
  pattern,
}: StudyPatternRowProps) {
  return (
    <div className="relative border-b last:border-b-0">
      {/* =====================================================
          DESKTOP
      ===================================================== */}

      <div className="hidden min-h-[82px] grid-cols-[minmax(180px,1fr)_minmax(300px,2fr)_130px_64px] items-center gap-4 px-5 py-4 transition hover:bg-muted/20 md:grid lg:px-6">
        {/* Pattern Name */}

        <div className="min-w-0">
          <p className="truncate font-semibold">
            {pattern.name}
          </p>

          <p className="mt-1 text-xs text-muted-foreground">
            {pattern.patternArr.length}{" "}
            {pattern.patternArr.length === 1
              ? "part"
              : "parts"}
          </p>
        </div>

        {/* Pattern Parts */}

        <div className="flex min-w-0 flex-wrap items-center gap-1.5">
          {pattern.patternArr.map((part, index) => (
            <div
              key={part.id}
              className="flex items-center gap-1.5"
            >
              <span className="rounded-md bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">
                {index + 1}. {part.name}
              </span>

              {index < pattern.patternArr.length - 1 && (
                <span className="text-xs text-muted-foreground">
                  →
                </span>
              )}
            </div>
          ))}
        </div>

        {/* Batches */}

        <div>
          <span className="inline-flex rounded-full bg-muted px-3 py-1 text-xs font-medium">
            {pattern._count.batches}{" "}
            {pattern._count.batches === 1
              ? "batch"
              : "batches"}
          </span>
        </div>

        {/* Actions */}

        <PatternActions
          patternId={pattern.id}
          patternName={pattern.name}
        />
      </div>

      {/* =====================================================
          MOBILE
      ===================================================== */}

      <div className="flex items-start gap-4 px-4 py-5 transition hover:bg-muted/20 md:hidden">
        <div className="min-w-0 flex-1">
          {/* Name */}

          <p className="font-semibold">
            {pattern.name}
          </p>

          {/* Parts */}

          <div className="mt-3 flex flex-wrap gap-1.5">
            {pattern.patternArr.map((part, index) => (
              <span
                key={part.id}
                className="rounded-md bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary"
              >
                {index + 1}. {part.name}
              </span>
            ))}
          </div>

          {/* Batch count */}

          <div className="mt-3">
            <span className="inline-flex rounded-full bg-muted px-3 py-1 text-xs font-medium">
              {pattern._count.batches}{" "}
              {pattern._count.batches === 1
                ? "batch"
                : "batches"}
            </span>
          </div>
        </div>

        {/* Actions */}

        <PatternActions
          patternId={pattern.id}
          patternName={pattern.name}
        />
      </div>
    </div>
  );
}