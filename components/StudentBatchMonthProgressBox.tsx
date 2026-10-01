"use client";

import * as React from "react";

import { ChevronRight, Loader2 } from "lucide-react";
import { Collapsible } from "@base-ui/react/collapsible";

import { fetchStudentBatchMonthProgress } from "@/app/ServerActions/getProgress/actions";

import type {
  GetStudentBatchMonthProgressInput,
  ProgressRecord,
  StudentBatchMonthProgressDay,
} from "@/app/ServerActions/getProgress/types";

import {
  formatLearning,
  groupLearnings,
  parseLearnings,
} from "@/app/ServerActions/getProgress/parser";

type Props = GetStudentBatchMonthProgressInput & {
  studentName: string;
};

/* -------------------------------------------------------------------------- */
/* DATE HELPERS                                                               */
/* -------------------------------------------------------------------------- */

function dateKey(date: Date | string) {
  return new Date(date).toISOString().slice(0, 10);
}

function formatDate(date: Date) {
  return date.toLocaleDateString("en-US", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}

function getDaysInMonth(year: number, month: number): Date[] {
  const count = new Date(
    Date.UTC(year, month, 0)
  ).getUTCDate();

  return Array.from({ length: count }, (_, index) => {
    return new Date(
      Date.UTC(year, month - 1, index + 1)
    );
  });
}

/* -------------------------------------------------------------------------- */
/* LEARNING CONTENT                                                           */
/* -------------------------------------------------------------------------- */

function LearningContent({
  progress,
}: {
  progress: ProgressRecord;
}) {
  const learnings = parseLearnings(progress);

  if (!learnings.length) {
    return (
      <div className="text-sm text-muted-foreground">
        No learning recorded.
      </div>
    );
  }

  const groups = groupLearnings(learnings);

  return (
    <div className="space-y-3">
      {groups.map((group) => (
        <div
          key={`${group.subjectName}-${group.status}`}
          className="min-w-0"
        >
          <div className="text-sm font-semibold text-foreground">
            {group.subjectName}
          </div>

          <div className="mt-1 space-y-0.5">
            {group.learnings.map((learning, index) => {
              const formatted = formatLearning(learning);

              if (!formatted) {
                return null;
              }

              return (
                <div
                  key={
                    learning.learningId ??
                    `${group.subjectName}-${index}`
                  }
                  className="text-sm leading-6 text-muted-foreground"
                >
                  <span className="font-medium text-foreground">
                    {group.status}:
                  </span>{" "}

                  {typeof formatted === "string" ? (
                    <span>{formatted}</span>
                  ) : (
                    <>
                      <span>{formatted.fromText}</span>

                      {formatted.fromText && formatted.toText && (
                        <>
                          {" "}
                          <span className="font-semibold text-foreground">
                            to
                          </span>{" "}
                        </>
                      )}

                      <span className="font-medium text-foreground">
                        {formatted.toText}
                      </span>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* MONTH CONTENT                                                              */
/* -------------------------------------------------------------------------- */

function MonthProgress({
  days,
  progressByDate,
  loaded,
}: {
  days: Date[];
  progressByDate: Map<string, ProgressRecord | null>;
  loaded: boolean;
}) {
  return (
    <div className="divide-y divide-border">
      {days.map((day) => {
        const key = dateKey(day);
        const progress = progressByDate.get(key);

        return (
          <div
            key={key}
            className="flex flex-col gap-2 px-3 py-3 sm:grid sm:grid-cols-[100px_minmax(0,1fr)] sm:gap-4"
          >
            {/* DATE */}
            <div className="text-sm font-medium text-foreground">
              {formatDate(day)}
            </div>

            {/* PROGRESS */}
            <div className="min-w-0">
              {!loaded ? (
                <span className="text-sm text-muted-foreground">
                  Loading...
                </span>
              ) : progress ? (
                <LearningContent progress={progress} />
              ) : (
                <span className="text-sm text-muted-foreground">
                  No progress
                </span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* MAIN CONTENT                                                               */
/* -------------------------------------------------------------------------- */

function StudentProgressContent({
  studentId,
  batchId,
  year,
  month,
  studentName,
}: Props) {
  const days = React.useMemo(
    () => getDaysInMonth(year, month),
    [year, month]
  );

  const [open, setOpen] = React.useState(false);

  const [monthProgress, setMonthProgress] =
    React.useState<StudentBatchMonthProgressDay[] | null>(
      null
    );

  const [loading, setLoading] = React.useState(false);

  const [error, setError] = React.useState<string | null>(
    null
  );

  /*
   * Prevent two requests if the user clicks very quickly.
   */
  const loadingRef = React.useRef(false);

  const progressByDate = React.useMemo(() => {
    const map = new Map<
      string,
      ProgressRecord | null
    >();

    if (!monthProgress) {
      return map;
    }

    for (const day of monthProgress) {
      map.set(dateKey(day.date), day.progress);
    }

    return map;
  }, [monthProgress]);

  const loadProgress = React.useCallback(async () => {
    if (monthProgress || loadingRef.current) {
      return;
    }

    loadingRef.current = true;
    setLoading(true);
    setError(null);

    try {
      const result =
        await fetchStudentBatchMonthProgress({
          studentId,
          batchId,
          year,
          month,
        });

      setMonthProgress(result);
    } catch (error) {
      console.error(
        "Failed to load student progress:",
        error
      );

      setError("Failed to load progress.");
    } finally {
      loadingRef.current = false;
      setLoading(false);
    }
  }, [
    studentId,
    batchId,
    year,
    month,
    monthProgress,
  ]);

  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen);

    if (nextOpen && !monthProgress) {
      void loadProgress();
    }
  };

  const monthLabel = new Date(
    year,
    month - 1,
    1
  ).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  return (
    <Collapsible.Root
      open={open}
      onOpenChange={handleOpenChange}
    >
      <div className="overflow-hidden rounded-xl border border-border bg-card">
        {/* STUDENT NAME */}
        <Collapsible.Trigger
          className="
            group
            flex
            min-h-12
            w-full
            items-center
            justify-between
            gap-3
            px-3
            py-3
            text-left
            hover:bg-muted/40
            focus-visible:outline-none
            focus-visible:ring-2
            focus-visible:ring-ring
          "
        >
          <div className="flex min-w-0 items-center gap-2">
            <ChevronRight
              className="
                size-4
                shrink-0
                text-muted-foreground
                transition-transform
                duration-200
                group-data-[panel-open]:rotate-90
              "
            />

            <span className="truncate text-sm font-semibold">
              {studentName}
            </span>
          </div>

          <div className="shrink-0 text-xs text-muted-foreground">
            {loading ? (
              <span className="inline-flex items-center gap-1.5">
                <Loader2 className="size-3 animate-spin" />
                Loading
              </span>
            ) : (
              monthLabel
            )}
          </div>
        </Collapsible.Trigger>

        <Collapsible.Panel>
          <div className="border-t border-border">
            {error ? (
              <div className="px-3 py-4 text-sm text-destructive">
                {error}
              </div>
            ) : (
              <MonthProgress
                days={days}
                progressByDate={progressByDate}
                loaded={monthProgress !== null}
              />
            )}
          </div>
        </Collapsible.Panel>
      </div>
    </Collapsible.Root>
  );
}

/* -------------------------------------------------------------------------- */
/* PUBLIC COMPONENT                                                           */
/* -------------------------------------------------------------------------- */

export default function StudentBatchMonthProgressBox(
  props: Props
) {
  const componentKey = `${props.studentId}:${props.batchId}:${props.year}:${props.month}`;

  return (
    <StudentProgressContent
      key={componentKey}
      {...props}
    />
  );
}