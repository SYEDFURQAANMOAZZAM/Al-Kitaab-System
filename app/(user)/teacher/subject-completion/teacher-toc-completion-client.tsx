
"use client";

import * as React from "react";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Search,
} from "lucide-react";
import { Collapsible } from "@base-ui/react/collapsible";

import {
  getTeacherTocReport,
} from "@/app/ServerActions/getTocCompletionReports/actions/get-teacher-toc-report";

import type {
  StudentTocReport,
  TocReportNode,
  PaginatedTocReport,
} from "@/app/ServerActions/getTocCompletionReports/types/tocReport.types";

type Pagination = Omit<PaginatedTocReport, "data">;

const MONTHS = [
  { value: "01", label: "January" },
  { value: "02", label: "February" },
  { value: "03", label: "March" },
  { value: "04", label: "April" },
  { value: "05", label: "May" },
  { value: "06", label: "June" },
  { value: "07", label: "July" },
  { value: "08", label: "August" },
  { value: "09", label: "September" },
  { value: "10", label: "October" },
  { value: "11", label: "November" },
  { value: "12", label: "December" },
];

const YEARS = Array.from(
  { length: 10 },
  (_, index) => new Date().getFullYear() - index,
);

function getCompletionStyle(value: number) {
  if (value === 0) {
    return {
      row: "",
      badge: "border-border/60 bg-background text-muted-foreground",
    };
  }

  if (value < 25) {
    return {
      row: "bg-muted/25",
      badge: "border-border/60 bg-muted text-muted-foreground",
    };
  }

  if (value < 50) {
    return {
      row: "bg-secondary/30",
      badge: "border-border/60 bg-secondary text-secondary-foreground",
    };
  }

  if (value < 75) {
    return {
      row: "bg-accent/30",
      badge: "border-border/60 bg-accent text-accent-foreground",
    };
  }

  if (value < 100) {
    return {
      row: "bg-primary/5",
      badge: "border-primary/20 bg-primary/10 text-primary",
    };
  }

  return {
    row: "bg-primary/10",
    badge: "border-primary/30 bg-primary/15 text-primary",
  };
}

function Percentage({ value }: { value: number }) {
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
    <ChevronRight
      className="size-4 shrink-0 text-muted-foreground transition-transform duration-200 group-data-[panel-open]:rotate-90 group-aria-expanded:rotate-90"
    />
  );
}

function Panel({ children }: { children: React.ReactNode }) {
  return (
    <Collapsible.Panel className="overflow-hidden data-[starting-style]:animate-accordion-down data-[ending-style]:animate-accordion-up">
      {children}
    </Collapsible.Panel>
  );
}

function TocItemRow({ item }: { item: TocReportNode }) {
  const hasChildren = item.children.length > 0;
  const style = getCompletionStyle(item.percentage);

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
        <Percentage value={item.percentage} />
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
        <Percentage value={item.percentage} />
      </Collapsible.Trigger>

      <Panel>
        <div className="mx-1.5 mb-1.5 overflow-hidden rounded-md border border-border/60 bg-background">
          {item.children.map((child) => (
            <TocItemRow key={child.id} item={child} />
          ))}
        </div>
      </Panel>
    </Collapsible.Root>
  );
}

type Subject = StudentTocReport["subjects"][number];

function SubjectRow({ subject }: { subject: Subject }) {
  const style = getCompletionStyle(subject.percentage);

  // Like the admin report, display TOC items directly under the subject.
  const tocItems = subject.parts.flatMap((part) => part.children);
  const hasToc = tocItems.length > 0;

  return (
    <Collapsible.Root>
      <Collapsible.Trigger
        disabled={!hasToc}
        className={`group flex min-h-11 w-full items-center justify-between gap-2 border-t border-border/50 px-2.5 py-2.5 text-left text-foreground transition-colors hover:bg-accent/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-default ${style.row}`}
      >
        <div className="flex min-w-0 items-center gap-1.5">
          <Chevron />
          <span className="min-w-0 truncate text-sm font-semibold tracking-tight">
            {subject.name}
          </span>
        </div>
        <Percentage value={subject.percentage} />
      </Collapsible.Trigger>

      {hasToc && (
        <Panel>
          <div className="mx-1.5 mb-1.5 overflow-hidden rounded-md border border-border/60 bg-background">
            {tocItems.map((item) => (
              <TocItemRow key={item.id} item={item} />
            ))}
          </div>
        </Panel>
      )}
    </Collapsible.Root>
  );
}

function StudentRow({ student }: { student: StudentTocReport }) {
  const hasSubjects = student.subjects.length > 0;

  return (
    <Collapsible.Root>
      <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
        <Collapsible.Trigger
          disabled={!hasSubjects}
          className="group flex min-h-12 w-full items-center justify-between gap-2 px-3 py-3 text-left transition-colors hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-default"
        >
          <div className="flex min-w-0 items-center gap-2">
            <Chevron />
            <span className="min-w-0 truncate text-base font-bold tracking-tight text-foreground">
              {student.name}
            </span>
          </div>
          <span className="shrink-0 text-xs text-muted-foreground">
            {student.subjects.length}{" "}
            {student.subjects.length === 1 ? "subject" : "subjects"}
          </span>
        </Collapsible.Trigger>

        <Panel>
          {hasSubjects ? (
            <div className="border-t border-border bg-muted/20">
              {student.subjects.map((subject) => (
                <SubjectRow key={subject.id} subject={subject} />
              ))}
            </div>
          ) : (
            <div className="border-t border-border px-3 py-4 text-sm text-muted-foreground">
              No assigned subjects found for this student.
            </div>
          )}
        </Panel>
      </div>
    </Collapsible.Root>
  );
}

export default function TeacherTocCompletionClient() {
  const [students, setStudents] = React.useState<StudentTocReport[]>([]);
  const [search, setSearch] = React.useState("");
  const [month, setMonth] = React.useState("");
  const [year, setYear] = React.useState("");
  const [appliedMonth, setAppliedMonth] = React.useState<string | undefined>();
  const [pagination, setPagination] = React.useState<Pagination>({
    page: 1,
    pageSize: 15,
    totalStudents: 0,
    totalPages: 0,
    hasNextPage: false,
    hasPreviousPage: false,
  });
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const requestId = React.useRef(0);

  const loadReports = React.useCallback(
    async (
      requestedPage: number,
      requestedSearch: string,
      requestedMonth?: string,
    ) => {
      const currentRequest = ++requestId.current;
      setLoading(true);
      setError(null);

      try {
        const result = await getTeacherTocReport({
          // Empty arrays mean all batches and subjects assigned to this teacher.
          // The server service applies the teacher's actual permissions.
          batchIds: [],
          subjectIds: [],
          page: requestedPage,
          search: requestedSearch,
          month: requestedMonth,
        });

        if (currentRequest !== requestId.current) return;

        setStudents(result.data);
        setPagination({
          page: result.page,
          pageSize: result.pageSize,
          totalStudents: result.totalStudents,
          totalPages: result.totalPages,
          hasNextPage: result.hasNextPage,
          hasPreviousPage: result.hasPreviousPage,
        });
      } catch (err) {
        if (currentRequest !== requestId.current) return;
        console.error("Failed to load teacher TOC report:", err);
        setError("Failed to load student reports. Please try again.");
        setStudents([]);
      } finally {
        if (currentRequest === requestId.current) {
          setLoading(false);
        }
      }
    },
    [],
  );

  // Initial load and debounced student search.
  React.useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadReports(1, search, appliedMonth);
    }, search ? 300 : 0);

    return () => window.clearTimeout(timer);
  }, [search, appliedMonth, loadReports]);

  const handleFetch = () => {
    const hasMonth = Boolean(month);
    const hasYear = Boolean(year);

    if (hasMonth !== hasYear) {
      setError("Please select both month and year.");
      return;
    }

    const nextMonth =
      hasMonth && hasYear
        ? `${year}-${month.padStart(2, "0")}`
        : undefined;

    setAppliedMonth(nextMonth);
    void loadReports(1, search, nextMonth);
  };

  const handleClearFilter = () => {
    setMonth("");
    setYear("");
    setAppliedMonth(undefined);
    setError(null);
    void loadReports(1, search, undefined);
  };

  const handlePrevious = () => {
    if (loading || !pagination.hasPreviousPage) return;
    void loadReports(pagination.page - 1, search, appliedMonth);
  };

  const handleNext = () => {
    if (loading || !pagination.hasNextPage) return;
    void loadReports(pagination.page + 1, search, appliedMonth);
  };

  const hasPendingFilter = Boolean(month) || Boolean(year);
  const selectedMonth =
    month && year ? `${year}-${month.padStart(2, "0")}` : undefined;
  const isSameAsApplied = selectedMonth === appliedMonth;

  const appliedMonthLabel = appliedMonth
    ? new Date(`${appliedMonth}-01T00:00:00`).toLocaleDateString(
        "en-US",
        { month: "long", year: "numeric" },
      )
    : "All time";

  const canFetch =
    !loading &&
    (
      (!hasPendingFilter && appliedMonth !== undefined) ||
      (Boolean(month) && Boolean(year) && !isSameAsApplied) ||
      (!hasPendingFilter && appliedMonth === undefined)
    );

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="rounded-xl border border-border bg-card p-3 shadow-sm sm:p-4">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="min-w-0 flex-1">
            <label
              htmlFor="teacher-toc-search"
              className="mb-1.5 block text-[11px] font-medium text-muted-foreground"
            >
              Search students
            </label>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <input
                id="teacher-toc-search"
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search by student name..."
                className="h-10 w-full rounded-md border border-input bg-background pl-9 pr-3 text-sm text-foreground outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50"
              />
            </div>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <div className="min-w-0">
              <label
                htmlFor="teacher-toc-month"
                className="mb-1.5 block text-[11px] font-medium text-muted-foreground"
              >
                Month
              </label>
              <select
                id="teacher-toc-month"
                value={month}
                onChange={(event) => setMonth(event.target.value)}
                className="h-10 w-full min-w-[130px] rounded-md border border-input bg-background px-3 text-sm text-foreground shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
              >
                <option value="">All time</option>
                {MONTHS.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="min-w-0">
              <label
                htmlFor="teacher-toc-year"
                className="mb-1.5 block text-[11px] font-medium text-muted-foreground"
              >
                Year
              </label>
              <select
                id="teacher-toc-year"
                value={year}
                onChange={(event) => setYear(event.target.value)}
                className="h-10 w-full min-w-[110px] rounded-md border border-input bg-background px-3 text-sm text-foreground shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
              >
                <option value="">Select year</option>
                {YEARS.map((value) => (
                  <option key={value} value={String(value)}>
                    {value}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="button"
              onClick={handleFetch}
              disabled={!canFetch}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground shadow-sm transition-colors hover:bg-primary/90 disabled:pointer-events-none disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Fetching
                </>
              ) : (
                <>
                  <CalendarDays className="size-4" />
                  Fetch
                </>
              )}
            </button>

            {hasPendingFilter && (
              <button
                type="button"
                onClick={handleClearFilter}
                disabled={loading}
                className="h-10 rounded-md px-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-50"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {hasPendingFilter && !isSameAsApplied && (
          <div className="mt-3 flex items-center gap-2 rounded-md border border-primary/20 bg-primary/5 px-3 py-2 text-xs text-muted-foreground">
            <CalendarDays className="size-3.5 shrink-0 text-primary" />
            <span>
              {month && year
                ? `Ready to fetch ${MONTHS.find((item) => item.value === month)?.label} ${year}.`
                : "Select both month and year to fetch a monthly report."}
            </span>
          </div>
        )}
      </div>

      {/* Result information */}
      <div className="flex flex-col gap-2 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
        <span>
          {pagination.totalStudents}{" "}
          {pagination.totalStudents === 1 ? "student" : "students"}
        </span>

        <div className="flex items-center gap-3">
          <span className="rounded-md border border-border bg-muted/40 px-2 py-1 text-xs font-medium text-foreground">
            {appliedMonthLabel}
          </span>
          {pagination.totalPages > 0 && (
            <span>
              Page {pagination.page} of {pagination.totalPages}
            </span>
          )}
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {loading && (
        <div className="flex items-center justify-center rounded-xl border border-border bg-card px-4 py-10 text-sm text-muted-foreground">
          <Loader2 className="mr-2 size-4 animate-spin" />
          Loading student reports...
        </div>
      )}

      {!loading && students.length > 0 && (
        <div className="space-y-3">
          {students.map((student) => (
            <StudentRow key={student.id} student={student} />
          ))}
        </div>
      )}

      {!loading && students.length === 0 && (
        <div className="rounded-xl border border-border bg-card px-4 py-8 text-center text-sm text-muted-foreground">
          {search.trim()
            ? "No students found."
            : "No students available in your assigned batches and subjects."}
        </div>
      )}

      {/* Pagination */}
      {!loading && pagination.totalPages > 0 && (
        <div className="flex items-center justify-between gap-3 border-t border-border pt-4">
          <button
            type="button"
            onClick={handlePrevious}
            disabled={!pagination.hasPreviousPage}
            className="inline-flex h-9 items-center gap-1.5 rounded-md border border-border bg-background px-3 text-sm font-medium text-foreground transition-colors hover:bg-accent disabled:pointer-events-none disabled:opacity-50"
          >
            <ChevronLeft className="size-4" />
            Previous
          </button>

          <span className="text-sm tabular-nums text-muted-foreground">
            {pagination.page} / {pagination.totalPages}
          </span>

          <button
            type="button"
            onClick={handleNext}
            disabled={!pagination.hasNextPage}
            className="inline-flex h-9 items-center gap-1.5 rounded-md border border-border bg-background px-3 text-sm font-medium text-foreground transition-colors hover:bg-accent disabled:pointer-events-none disabled:opacity-50"
          >
            Next
            <ChevronRight className="size-4" />
          </button>
        </div>
      )}
    </div>
  );
}
