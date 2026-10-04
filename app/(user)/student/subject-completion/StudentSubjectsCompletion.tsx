
"use client";

import * as React from "react";
import { Collapsible } from "@base-ui/react/collapsible";
import {
  BookOpen,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  GraduationCap,
  Loader2,
  RefreshCw,
  Target,
} from "lucide-react";

import { getStudentTocReport } from "@/app/ServerActions/getTocCompletionReports/actions/get-student-toc-report";
import type {
  StudentTocReport,
  TocReportNode,
} from "@/app/ServerActions/getTocCompletionReports/types/tocReport.types";

type Subject = StudentTocReport["subjects"][number];

type Props = {
  initialReport: StudentTocReport[];
};

function getCompletionStyle(value: number) {
  if (value === 100) {
    return {
      badge: "border-emerald-500/20 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
      bar: "bg-emerald-500",
      text: "text-emerald-600 dark:text-emerald-400",
    };
  }

  if (value >= 75) {
    return {
      badge: "border-primary/20 bg-primary/10 text-primary",
      bar: "bg-primary",
      text: "text-primary",
    };
  }

  if (value >= 40) {
    return {
      badge: "border-amber-500/20 bg-amber-500/10 text-amber-600 dark:text-amber-400",
      bar: "bg-amber-500",
      text: "text-amber-600 dark:text-amber-400",
    };
  }

  if (value > 0) {
    return {
      badge: "border-sky-500/20 bg-sky-500/10 text-sky-600 dark:text-sky-400",
      bar: "bg-sky-500",
      text: "text-sky-600 dark:text-sky-400",
    };
  }

  return {
    badge: "border-border bg-muted text-muted-foreground",
    bar: "bg-muted-foreground/30",
    text: "text-muted-foreground",
  };
}

function ProgressBar({ value }: { value: number }) {
  const style = getCompletionStyle(value);

  return (
    <div
      className="h-2 w-full overflow-hidden rounded-full bg-muted"
      role="progressbar"
      aria-label="Completion"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={value}
    >
      <div
        className={`h-full rounded-full transition-all duration-300 ${style.bar}`}
        style={{ width: `${Math.max(0, Math.min(100, value))}%` }}
      />
    </div>
  );
}

function Percentage({ value }: { value: number }) {
  const style = getCompletionStyle(value);

  return (
    <span
      className={`shrink-0 rounded-md border px-2 py-1 text-xs font-semibold tabular-nums ${style.badge}`}
    >
      {value}%
    </span>
  );
}

function TocItem({
  item,
  depth = 0,
}: {
  item: TocReportNode;
  depth?: number;
}) {
  const hasChildren = item.children.length > 0;
  const style = getCompletionStyle(item.percentage);

  if (!hasChildren) {
    return (
      <div
        className={`flex min-h-10 items-center justify-between gap-3 border-t border-border/40 px-3 py-2 ${style.text}`}
        style={{ paddingLeft: `${12 + depth * 14}px` }}
      >
        <span className="min-w-0 truncate text-sm">
          {item.name}
        </span>

        <div className="flex shrink-0 items-center gap-2">
          {item.percentage === 100 && (
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
          )}

          <Percentage value={item.percentage} />
        </div>
      </div>
    );
  }

  return (
    <Collapsible.Root defaultOpen={false}>
      <Collapsible.Trigger
        className="group flex min-h-11 w-full items-center justify-between gap-2 border-t border-border/40 px-3 py-2 text-left transition-colors hover:bg-accent/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        style={{ paddingLeft: `${12 + depth * 14}px` }}
      >
        <span className="flex min-w-0 items-center gap-2">
          <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-data-[panel-open]:rotate-90" />

          <span className="truncate text-sm font-medium">
            {item.name}
          </span>
        </span>

        <div className="flex shrink-0 items-center gap-2">
          {item.percentage === 100 && (
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
          )}

          <Percentage value={item.percentage} />
        </div>
      </Collapsible.Trigger>

      <Collapsible.Panel className="overflow-hidden">
        <div className="mx-2 mb-2 overflow-hidden rounded-lg border border-border/50 bg-background">
          {item.children.map((child) => (
            <TocItem
              key={child.id}
              item={child}
              depth={depth + 1}
            />
          ))}
        </div>
      </Collapsible.Panel>
    </Collapsible.Root>
  );
}

function SubjectCard({ subject }: { subject: Subject }) {
  const style = getCompletionStyle(subject.percentage);
  const tocItems = subject.parts.flatMap((part) => part.children);

  return (
    <article className="min-w-0 overflow-hidden rounded-xl border bg-card shadow-sm">
      {/* Always-visible subject summary */}
      <div className="space-y-4 p-4 sm:p-5">
        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <BookOpen className="h-5 w-5" />
          </div>

          <div className="min-w-0 flex-1">
            <h2 className="break-words text-base font-semibold tracking-tight sm:text-lg">
              {subject.name}
            </h2>
            <p className="mt-1 text-xs text-muted-foreground">
              {subject.completedLeaves} of {subject.totalLeaves} items completed
            </p>
          </div>

          <Percentage value={subject.percentage} />
        </div>

        <ProgressBar value={subject.percentage} />

        <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
          <span>
            {subject.percentage === 100
              ? "Subject completed"
              : subject.percentage === 0
                ? "Not started"
                : "In progress"}
          </span>
          <span className={`font-medium ${style.text}`}>
            {subject.percentage}% complete
          </span>
        </div>
      </div>

      {/* TOC is visible within the subject card; hierarchy can expand */}
      {tocItems.length > 0 ? (
        <Collapsible.Root defaultOpen={false}>
          <Collapsible.Trigger className="group flex w-full items-center justify-between px-4 py-2.5 text-left hover:bg-accent/40 sm:px-5">
            <span className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              <ChevronRight className="h-4 w-4 transition-transform group-data-[panel-open]:rotate-90" />
              Completion breakdown
            </span>

            <span className="text-xs text-muted-foreground">
              {tocItems.length} {tocItems.length === 1 ? "section" : "sections"}
            </span>
          </Collapsible.Trigger>

          <Collapsible.Panel className="overflow-hidden">
            <div className="mx-3 mb-3 overflow-hidden rounded-lg border border-border/60 bg-background sm:mx-4">
              {tocItems.map((item) => (
                <TocItem key={item.id} item={item} />
              ))}
            </div>
          </Collapsible.Panel>
        </Collapsible.Root>
      ) : (
        <div className="border-t px-4 py-3 text-sm text-muted-foreground">
          No TOC items available for this subject.
        </div>
      )}
    </article>
  );
}

function formatMonth(month: string) {
  if (!month) return "All time";

  const [year, monthNumber] = month.split("-").map(Number);

  return new Date(year, monthNumber - 1, 1).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });
}

export default function StudentSubjectsCompletion({
  initialReport,
}: Props) {
  const [report, setReport] = React.useState(initialReport);
  const [month, setMonth] = React.useState("");
  const [appliedMonth, setAppliedMonth] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const student = report[0];
  const subjects = student?.subjects ?? [];

  const totalSubjects = subjects.length;
  const totalItems = subjects.reduce(
    (sum, subject) => sum + subject.totalLeaves,
    0
  );
  const completedItems = subjects.reduce(
    (sum, subject) => sum + subject.completedLeaves,
    0
  );
  const overallPercentage =
    totalItems > 0
      ? Math.round((completedItems / totalItems) * 100)
      : 0;

  async function fetchReport(nextMonth: string) {
    setLoading(true);
    setError(null);

    try {
      const result = await getStudentTocReport({
        month: nextMonth || undefined,
      });

      setReport(result);
      setAppliedMonth(nextMonth);
    } catch (err) {
      console.error("Failed to load subject completion report:", err);
      setError("Unable to load your subject completion report. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  function handleFetch() {
    if (month === appliedMonth) return;
    void fetchReport(month);
  }

  function handleClear() {
    setMonth("");
    if (appliedMonth !== "") {
      void fetchReport("");
    }
  }

  return (
    <main className="mx-auto w-full min-w-0 max-w-5xl space-y-6 pb-8">
      {/* Page heading */}
      <section className="space-y-2">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <GraduationCap className="h-4 w-4" />
          <span>Student Portal</span>
          <span>/</span>
          <span className="text-foreground">Subject Completion</span>
        </div>

        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
            My Subject Completion
          </h1>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground sm:text-base">
            Track your learning progress and see how much you have completed
            in each subject.
          </p>
        </div>
      </section>

      {/* Overview */}
      <section className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="rounded-xl border bg-card p-4 shadow-sm">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <BookOpen className="h-4 w-4" />
            My Subjects
          </div>
          <p className="mt-3 text-2xl font-bold tabular-nums">
            {totalSubjects}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Assigned subjects
          </p>
        </div>

        <div className="rounded-xl border bg-card p-4 shadow-sm">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <CheckCircle2 className="h-4 w-4" />
            Completed Items
          </div>
          <p className="mt-3 text-2xl font-bold tabular-nums">
            {completedItems}
            <span className="ml-1 text-sm font-medium text-muted-foreground">
              / {totalItems}
            </span>
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Tracked TOC items
          </p>
        </div>

        <div className="rounded-xl border bg-card p-4 shadow-sm">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Target className="h-4 w-4" />
            Overall Completion
          </div>
          <p className="mt-3 text-2xl font-bold tabular-nums">
            {overallPercentage}%
          </p>
          <div className="mt-2">
            <ProgressBar value={overallPercentage} />
          </div>
        </div>
      </section>

      {/* Month filter */}
      <section className="rounded-xl border bg-card p-4 shadow-sm sm:p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0">
            <h2 className="flex items-center gap-2 text-sm font-semibold">
              <CalendarDays className="h-4 w-4 text-primary" />
              Filter by month
            </h2>
            <p className="mt-1 text-xs text-muted-foreground">
              Select a month to view items completed during that period.
            </p>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
            <div className="min-w-0 flex-1">
              <label
                htmlFor="completion-month"
                className="mb-1.5 block text-xs font-medium text-muted-foreground"
              >
                Month and year
              </label>
              <input
                id="completion-month"
                type="month"
                value={month}
                onChange={(event) => setMonth(event.target.value)}
                disabled={loading}
                className="h-10 w-full min-w-[180px] rounded-md border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/50 disabled:opacity-50"
              />
            </div>

            <button
              type="button"
              onClick={handleFetch}
              disabled={loading || month === appliedMonth}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:pointer-events-none disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Fetching
                </>
              ) : (
                <>
                  <RefreshCw className="h-4 w-4" />
                  Fetch
                </>
              )}
            </button>

            {appliedMonth !== "" && (
              <button
                type="button"
                onClick={handleClear}
                disabled={loading}
                className="h-10 rounded-md px-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-50"
              >
                All time
              </button>
            )}
          </div>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2 border-t pt-3 text-xs text-muted-foreground">
          <span>Showing:</span>
          <span className="rounded-md border bg-muted/50 px-2 py-1 font-medium text-foreground">
            {formatMonth(appliedMonth)}
          </span>
          {month !== appliedMonth && (
            <span className="text-amber-600 dark:text-amber-400">
              Selection not applied yet
            </span>
          )}
        </div>
      </section>

      {/* Error state */}
      {error && (
        <div
          role="alert"
          className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive"
        >
          {error}
        </div>
      )}

      {/* Subject list */}
      <section className="space-y-4">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <div>
            <h2 className="text-lg font-semibold sm:text-xl">
              My Subjects
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Your subjects and their completion details
            </p>
          </div>
          <span className="rounded-full bg-muted px-3 py-1 text-xs font-medium text-muted-foreground">
            {totalSubjects} {totalSubjects === 1 ? "subject" : "subjects"}
          </span>
        </div>

        {loading ? (
          <div className="flex items-center justify-center rounded-xl border bg-card px-4 py-12 text-sm text-muted-foreground">
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Loading your completion report...
          </div>
        ) : subjects.length > 0 ? (
          <div className="space-y-4">
            {subjects.map((subject) => (
              <SubjectCard key={subject.id} subject={subject} />
            ))}
          </div>
        ) : (
          <div className="rounded-xl border border-dashed bg-card px-5 py-12 text-center">
            <BookOpen className="mx-auto mb-3 h-9 w-9 text-muted-foreground" />
            <h3 className="font-semibold">No subjects found</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              No subjects are currently assigned to your student profile.
            </p>
          </div>
        )}
      </section>
    </main>
  );
}
