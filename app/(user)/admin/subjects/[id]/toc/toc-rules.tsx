import type { ReactNode } from "react";

type Part = {
  id: string;
  name: string;
  position: number;
};

type Subject = {
  id: string;
  name: string;
  parts: Part[];
};

export default function TocRules({
  subject,
}: {
  subject: Subject;
}) {
  return (
    <div className="space-y-5 text-sm">
      {/* =====================================================
          1. SUBJECT PART NAMES
      ===================================================== */}

      <div>
        <h3 className="mb-2 font-semibold">
          1. Subject part names
        </h3>

        <p className="text-muted-foreground">
          Every line must start with one of
          the SubjectPart names defined for
          this subject.
        </p>

        <pre className="mt-2 overflow-x-auto rounded-lg border bg-muted/40 p-3">
{subject.parts
  .map(
    (part) =>
      `${part.name}:value`,
  )
  .join("\n")}
        </pre>
      </div>

      {/* =====================================================
          2. HIERARCHY
      ===================================================== */}

      <div>
        <h3 className="mb-2 font-semibold">
          2. Hierarchy
        </h3>

        <p className="text-muted-foreground">
          Hierarchy is determined by the
          SubjectPart position. Indentation is
          optional and has no meaning.
        </p>

        <pre className="mt-2 overflow-x-auto rounded-lg border bg-muted/40 p-3">
{subject.parts
  .map(
    (part) =>
      `${part.name}:example`,
  )
  .join("\n")}
        </pre>
      </div>

      {/* =====================================================
          3. NORMAL VALUE
      ===================================================== */}

      <div>
        <h3 className="mb-2 font-semibold">
          3. Normal value
        </h3>

        <p className="text-muted-foreground">
          Use the format:
        </p>

        <pre className="mt-2 overflow-x-auto rounded-lg border bg-muted/40 p-3">
{`${subject.parts[0]?.name ?? "Part"}:1 Example`}
        </pre>
      </div>

      {/* =====================================================
          4. RANGE
      ===================================================== */}

      <div>
        <h3 className="mb-2 font-semibold">
          4. Range value
        </h3>

        <p className="text-muted-foreground">
          A range uses this syntax:
        </p>

        <pre className="mt-2 overflow-x-auto rounded-lg border bg-muted/40 p-3">
{`range(i=1-10):{i}`}
        </pre>

        <p className="mt-2 text-muted-foreground">
          The variable is replaced only when it
          appears inside{" "}
          <code className="rounded bg-muted px-1">
            {"{ }"}
          </code>
          .
        </p>

        <pre className="mt-2 overflow-x-auto rounded-lg border bg-muted/40 p-3">
{`range(i=1-10):Exercise {i}`}
        </pre>

        <p className="mt-2 text-muted-foreground">
          This generates Exercise 1 through
          Exercise 10.
        </p>
      </div>

      {/* =====================================================
          5. COMPLETE EXAMPLE
      ===================================================== */}

      <div>
        <h3 className="mb-2 font-semibold">
          5. Complete example
        </h3>

        <pre className="overflow-x-auto rounded-lg border bg-muted/40 p-3 leading-6">
{getExampleText(subject)}
        </pre>
      </div>
    </div>
  );
}

/* ============================================================
   EXAMPLE
============================================================ */

export function getExampleText(
  subject: Subject,
) {
  const parts = [...subject.parts].sort(
    (a, b) => a.position - b.position,
  );

  if (parts.length === 0) {
    return "";
  }

  if (parts.length === 1) {
    return `${parts[0].name}:range(i=1-10):{i}`;
  }

  if (parts.length === 2) {
    return `${parts[0].name}:1 Example
${parts[1].name}:range(i=1-10):{i}`;
  }

  if (parts.length === 3) {
    return `${parts[0].name}:1 Example
${parts[1].name}:range(i=1-2):{i}
${parts[2].name}:range(i=1-3):{i}`;
  }

  return parts
    .map(
      (part) =>
        `${part.name}:Example`,
    )
    .join("\n");
}