"use client";

import * as React from "react";

import {
  ChevronRight,
  Loader2,
  Search,
} from "lucide-react";

import { Collapsible } from "@base-ui/react/collapsible";

import { getSubjectTocReport } from "@/app/ServerActions/getTocCompletionReports/actions/get-subject-toc-report";

import type {
  StudentTocReport,
  TocReportNode,
} from "@/app/ServerActions/getTocCompletionReports/types/tocReport.types";

type Props = {
  subjectId: string;
  studentIds: string[];
};

function getCompletionStyle(value: number) {
  if (value === 0) {
    return {
      row: "",
      badge:
        "border-border/60 bg-background text-muted-foreground",
    };
  }

  if (value < 25) {
    return {
      row: "bg-muted/25",
      badge:
        "border-border/60 bg-muted text-muted-foreground",
    };
  }

  if (value < 50) {
    return {
      row: "bg-secondary/30",
      badge:
        "border-border/60 bg-secondary text-secondary-foreground",
    };
  }

  if (value < 75) {
    return {
      row: "bg-accent/30",
      badge:
        "border-border/60 bg-accent text-accent-foreground",
    };
  }

  if (value < 100) {
    return {
      row: "bg-primary/5",
      badge:
        "border-primary/20 bg-primary/10 text-primary",
    };
  }

  return {
    row: "bg-primary/10",
    badge:
      "border-primary/30 bg-primary/15 text-primary",
  };
}

function Percentage({
  value,
}: {
  value: number;
}) {
  const style = getCompletionStyle(value);

  return (
    <span
      className={`shrink-0 rounded-md border px-2 py-0.5 text-[11px] font-semibold tabular-nums ${style.badge}`}
    >
      {value}%
    </span>
  );
}

function Chevron() {
  return (
    <ChevronRight className="size-4 shrink-0 text-muted-foreground transition-transform duration-200 group-data-[panel-open]:rotate-90 group-aria-expanded:rotate-90" />
  );
}

function Panel({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Collapsible.Panel className="overflow-hidden data-[starting-style]:animate-accordion-down data-[ending-style]:animate-accordion-up">
      {children}
    </Collapsible.Panel>
  );
}

function TocItemRow({
  item,
}: {
  item: TocReportNode;
}) {
  const hasChildren =
    item.children.length > 0;

  const style = getCompletionStyle(
    item.percentage
  );

  if (!hasChildren) {
    return (
      <div
        className={`flex min-h-9 items-center justify-between gap-2 border-t border-border/40 px-2.5 py-2 pl-7 text-[13px] transition-colors ${style.row}`}
      >
        <span
          className={`min-w-0 truncate ${
            item.percentage > 0
              ? "text-foreground"
              : "text-muted-foreground"
          }`}
        >
          {item.name}
        </span>

        <Percentage
          value={item.percentage}
        />
      </div>
    );
  }

  return (
    <Collapsible.Root>
      <Collapsible.Trigger
        className={`group flex min-h-10 w-full items-center justify-between gap-2 px-2.5 py-2 text-left text-foreground transition-colors hover:bg-accent/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${style.row}`}
      >
        <div className="flex min-w-0 items-center gap-1.5">
          <Chevron />

          <span className="min-w-0 truncate text-[13px] font-medium">
            {item.name}
          </span>
        </div>

        <Percentage
          value={item.percentage}
        />
      </Collapsible.Trigger>

      <Panel>
        <div className="mx-1.5 mb-1.5 overflow-hidden rounded-md border border-border/60 bg-background">
          {item.children.map((child) => (
            <TocItemRow
              key={child.id}
              item={child}
            />
          ))}
        </div>
      </Panel>
    </Collapsible.Root>
  );
}



function StudentRow({
  student,
}: {
  student: StudentTocReport;
}) {
  const subject =
    student.subjects[0];

  if (!subject) {
    return (
      <div className="rounded-xl border border-border bg-card px-3 py-3">
        <span className="text-sm font-semibold">
          {student.name}
        </span>

        <p className="mt-1 text-xs text-muted-foreground">
          No completion data found.
        </p>
      </div>
    );
  }

  const tocItems = subject.parts.flatMap(
    (part) => part.children
  );

  const style = getCompletionStyle(
    subject.percentage
  );

  return (
    <Collapsible.Root>
      <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
        <Collapsible.Trigger
          className={`group flex min-h-12 w-full items-center justify-between gap-2 px-3 py-3 text-left transition-colors hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${style.row}`}
        >
          <div className="flex min-w-0 items-center gap-2">
            <Chevron />

            <span className="min-w-0 truncate text-base font-bold tracking-tight text-foreground">
              {student.name}
            </span>
          </div>

          <Percentage
            value={subject.percentage}
          />
        </Collapsible.Trigger>

        <Panel>
          <div className="border-t border-border bg-muted/20">
            {tocItems.map((item) => (
              <TocItemRow
                key={item.id}
                item={item}
              />
            ))}
          </div>
        </Panel>
      </div>
    </Collapsible.Root>
  );
}

export default function SubjectStudentCompletionClient({
  subjectId,
  studentIds,
}: Props) {
  const [students, setStudents] =
    React.useState<StudentTocReport[]>(
      []
    );

  const [search, setSearch] =
    React.useState("");

  const [loading, setLoading] =
    React.useState(true);

  const [error, setError] =
    React.useState<string | null>(null);

  const [month, setMonth] =
    React.useState<string | undefined>();

  const requestId =
    React.useRef(0);

  const loadReports =
    React.useCallback(
      async (requestedMonth?: string) => {
        const currentRequest =
          ++requestId.current;

        setLoading(true);
        setError(null);

        try {
          const result =
            await getSubjectTocReport({
              studentIds,
              subjectId,
              month: requestedMonth,
            });

          if (
            currentRequest !==
            requestId.current
          ) {
            return;
          }

          setStudents(result);
        } catch (err) {
          if (
            currentRequest !==
            requestId.current
          ) {
            return;
          }

          console.error(
            "Failed to load subject student completion:",
            err
          );

          setError(
            "Failed to load student completions. Please try again."
          );

          setStudents([]);
        } finally {
          if (
            currentRequest ===
            requestId.current
          ) {
            setLoading(false);
          }
        }
      },
      [studentIds, subjectId]
    );

  React.useEffect(() => {
    void loadReports(month);
  }, [loadReports, month]);

  const filteredStudents =
    React.useMemo(() => {
      const value =
        search.trim().toLowerCase();

      if (!value) {
        return students;
      }

      return students.filter(
        (student) =>
          student.name
            .toLowerCase()
            .includes(value)
      );
    }, [students, search]);

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="rounded-xl border border-border bg-card p-3 shadow-sm sm:p-4">
        <label
          htmlFor="subject-student-search"
          className="mb-1.5 block text-[11px] font-medium text-muted-foreground"
        >
          Search students
        </label>

        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />

          <input
            id="subject-student-search"
            type="search"
            value={search}
            onChange={(event) =>
              setSearch(event.target.value)
            }
            placeholder="Search by student name..."
            className="h-10 w-full rounded-md border border-input bg-background pl-9 pr-3 text-sm text-foreground outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50"
          />
        </div>
      </div>

      {/* Month */}
      <div className="flex items-center gap-2">
        <label
          htmlFor="subject-completion-month"
          className="text-sm font-medium"
        >
          Completion month
        </label>

        <input
          id="subject-completion-month"
          type="month"
          value={month ?? ""}
          onChange={(event) =>
            setMonth(
              event.target.value ||
                undefined
            )
          }
          className="h-9 rounded-md border border-input bg-background px-3 text-sm"
        />

        {month && (
          <button
            type="button"
            onClick={() =>
              setMonth(undefined)
            }
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            Clear
          </button>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center rounded-xl border border-border bg-card px-4 py-10 text-sm text-muted-foreground">
          <Loader2 className="mr-2 size-4 animate-spin" />
          Loading student completions...
        </div>
      )}

      {/* Students */}
      {!loading &&
        filteredStudents.length > 0 && (
          <div className="space-y-3">
            {filteredStudents.map(
              (student) => (
                <StudentRow
                  key={student.id}
                  student={student}
                />
              )
            )}
          </div>
        )}

      {/* Empty */}
      {!loading &&
        filteredStudents.length === 0 && (
          <div className="rounded-xl border border-border bg-card px-4 py-8 text-center text-sm text-muted-foreground">
            {search.trim()
              ? "No students found."
              : "No students are associated with this subject."}
          </div>
        )}
    </div>
  );
}