import { SubjectActions } from "./SubjectActions";

type Subject = {
  id: string;
  name: string;

  parts: {
    id: string;
    name: string;
    position: number;
  }[];
};

type SubjectRowProps = {
  subject: Subject;
};

export function SubjectRow({
  subject,
}: SubjectRowProps) {
  const sortedParts = [...subject.parts].sort(
    (a, b) => a.position - b.position
  );

  return (
    <div className="relative border-b last:border-b-0">
      {/* =====================================================
          DESKTOP
      ===================================================== */}

      <div className="hidden min-h-[82px] grid-cols-[minmax(180px,1fr)_minmax(300px,2fr)_64px] items-center gap-4 px-5 py-4 transition hover:bg-muted/20 md:grid lg:px-6">
        {/* Subject Name */}

        <div className="min-w-0">
          <p className="truncate font-semibold">
            {subject.name}
          </p>

          <p className="mt-1 text-xs text-muted-foreground">
            {sortedParts.length}{" "}
            {sortedParts.length === 1
              ? "part"
              : "parts"}
          </p>
        </div>

        {/* Subject Parts */}

        <div className="flex min-w-0 flex-wrap items-center gap-1.5">
          {sortedParts.length > 0 ? (
            sortedParts.map((part, index) => (
              <div
                key={part.id}
                className="flex items-center gap-1.5"
              >
                <span className="rounded-md bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">
                  {part.name}
                </span>

                {index < sortedParts.length - 1 && (
                  <span className="text-xs text-muted-foreground">
                    →
                  </span>
                )}
              </div>
            ))
          ) : (
            <span className="text-sm text-muted-foreground">
              No parts
            </span>
          )}
        </div>

        {/* Actions */}

        <SubjectActions
          subjectId={subject.id}
          subjectName={subject.name}
        />
      </div>

      {/* =====================================================
          MOBILE
      ===================================================== */}

      <div className="flex items-start gap-4 px-4 py-5 transition hover:bg-muted/20 md:hidden">
        <div className="min-w-0 flex-1">
          {/* Name */}

          <p className="font-semibold">
            {subject.name}
          </p>

          {/* Parts */}

          <div className="mt-3 flex flex-wrap items-center gap-1.5">
            {sortedParts.length > 0 ? (
              sortedParts.map((part, index) => (
                <div
                  key={part.id}
                  className="flex items-center gap-1.5"
                >
                  <span className="rounded-md bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">
                    {part.name}
                  </span>

                  {index < sortedParts.length - 1 && (
                    <span className="text-xs text-muted-foreground">
                      →
                    </span>
                  )}
                </div>
              ))
            ) : (
              <span className="text-sm text-muted-foreground">
                No parts
              </span>
            )}
          </div>
        </div>

        {/* Actions */}

        <SubjectActions
          subjectId={subject.id}
          subjectName={subject.name}
        />
      </div>
    </div>
  );
}