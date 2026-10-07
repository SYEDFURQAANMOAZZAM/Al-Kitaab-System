
"use client";

import * as React from "react";

import { ArrowRight, ChevronDown, Loader2 } from "lucide-react";

import { fetchStudentMonthProgress } from "@/app/ServerActions/getProgress/actions";

import type {
  GetStudentMonthProgressInput,
  ProgressRecord,
  StudentMonthProgressDay,
} from "@/app/ServerActions/getProgress/types";

import {
  formatLearning,
  groupLearnings,
  parseLearnings,
} from "@/app/ServerActions/getProgress/parser";

type Props = GetStudentMonthProgressInput & {
  batches: {
    id: string;
    name: string;
  }[];
};

/* -------------------------------------------------------------------------- */
/* DATE                                                                       */
/* -------------------------------------------------------------------------- */

function dateKey(date: Date | string) {
  return new Date(date).toISOString().slice(0, 10);
}

function formatDate(date: Date | string) {
  return new Date(date).toLocaleDateString("en-US", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

/* -------------------------------------------------------------------------- */
/* LEARNING                                                                   */
/* -------------------------------------------------------------------------- */

function LearningContent({
  progress,
}: {
  progress: ProgressRecord;
}) {
  const learnings = parseLearnings(progress);

  if (!learnings.length) {
    return (
      <span className="text-sm text-muted-foreground">
        No learning recorded
      </span>
    );
  }

  const groups = groupLearnings(learnings);

  return (
    <div className="min-w-0 space-y-3">
      {groups.map((group) => (
        <div
          key={`${group.subjectName}-${group.status}`}
          className="min-w-0"
        >
          <div className="break-words text-sm font-semibold text-foreground">
            {group.subjectName}
          </div>

          <div className="mt-1 space-y-1">
            {group.learnings.map((learning, index) => {
              const formatted = formatLearning(learning);

              return (
                <div
                  key={
                    learning.learningId ??
                    `${group.subjectName}-${index}`
                  }
                  className="break-words text-sm leading-6 text-muted-foreground [overflow-wrap:anywhere]"
                >
                  {formatted && (
                    <div>
                      <span className="font-medium text-foreground">
                        {group.status}:
                      </span>{" "}
                      {formatted.fromParts.map((part, partIndex) => (
                        <React.Fragment key={`from-${partIndex}`}>
                          {partIndex > 0 && <><span> </span><ArrowRight className="inline size-3 text-muted-foreground" aria-hidden="true" /><span> </span></>}
                          <span className="font-medium text-foreground">{part.label}</span>:
                          <span>{part.value}</span>
                        </React.Fragment>
                      ))}
                      {formatted.fromParts.length > 0 && formatted.toParts.length > 0 && (
                        <>
                          {" "}
                          <span className="font-semibold text-foreground">to</span>
                          {" "}
                        </>
                      )}
                      {formatted.toParts.map((part, partIndex) => (
                        <React.Fragment key={`to-${partIndex}`}>
                          {partIndex > 0 && <><span> </span><ArrowRight className="inline size-3 text-muted-foreground" aria-hidden="true" /><span> </span></>}
                          <span className="font-medium text-foreground">{part.label}</span>:
                          <span>{part.value}</span>
                        </React.Fragment>
                      ))}
                    </div>
                  )}
                  <div className="text-xs leading-5 text-muted-foreground">
                    <span className="font-medium text-foreground">Remark:</span>{" "}
                    <span className="text-muted-foreground">
                      {learning.remark || "None"}
                    </span>
                  </div>
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
/* DAILY PROGRESS                                                             */
/* -------------------------------------------------------------------------- */

function DailyProgressCell({
  progresses,
  batches,
}: {
  progresses: ProgressRecord[];
  batches: Props["batches"];
}) {
  if (!progresses.length) {
    return (
      <span className="text-sm text-muted-foreground">
        No progress
      </span>
    );
  }

  return (
    <div className="min-w-0">
      {progresses.map((progress, index) => {
        const batch = batches.find(
          (b) => b.id === progress.batchId
        );

        return (
          <div
            key={progress.id}
            className={`min-w-0 py-3 first:pt-0 last:pb-0 ${
              index !== progresses.length - 1
                ? "border-b border-border/50"
                : ""
            }`}
          >
            <div className="mb-2 text-xs font-semibold text-muted-foreground">
              {batch?.name ?? "Batch"}
            </div>

            <LearningContent progress={progress} />
          </div>
        );
      })}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* MOBILE DATE CARD                                                           */
/* -------------------------------------------------------------------------- */

function MobileProgressCard({
  day,
  batches,
}: {
  day: StudentMonthProgressDay;
  batches: Props["batches"];
}) {
  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card">
      {/* DATE */}

      <div className="border-b border-border bg-muted/40 px-3 py-3">
        <span className="text-sm font-semibold text-foreground">
          {formatDate(day.date)}
        </span>
      </div>

      {/* DAILY PROGRESS */}

      <div className="min-w-0 px-3 py-3">
        <DailyProgressCell
          progresses={day.progresses}
          batches={batches}
        />
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* DESKTOP TABLE                                                              */
/* -------------------------------------------------------------------------- */

function DesktopProgressTable({
  days,
  batches,
}: {
  days: StudentMonthProgressDay[];
  batches: Props["batches"];
}) {
  const scrollRef = React.useRef<HTMLDivElement>(null);

  const drag = React.useRef({
    active: false,
    startX: 0,
    scrollLeft: 0,
  });

  const handleMouseDown = (
    e: React.MouseEvent<HTMLDivElement>,
  ) => {
    if (e.button !== 0) return;

    const container = scrollRef.current;
    if (!container) return;

    drag.current = {
      active: true,
      startX: e.clientX,
      scrollLeft: container.scrollLeft,
    };

    container.style.cursor = "grabbing";
    container.style.userSelect = "none";
  };

  const handleMouseMove = (
    e: React.MouseEvent<HTMLDivElement>,
  ) => {
    const container = scrollRef.current;

    if (!container || !drag.current.active) return;

    e.preventDefault();

    const deltaX = e.clientX - drag.current.startX;

    container.scrollLeft =
      drag.current.scrollLeft - deltaX;
  };

  const stopDragging = () => {
    const container = scrollRef.current;
    drag.current.active = false;

    if (container) {
      container.style.cursor = "";
      container.style.userSelect = "";
    }
  };

  return (
    <div className="hidden w-full min-w-0 max-w-full overflow-hidden rounded-xl border border-border md:block">
      <div
        ref={scrollRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={stopDragging}
        onMouseLeave={stopDragging}
        onDragStart={(e) => e.preventDefault()}
        className="w-full min-w-0 max-w-full overflow-x-auto overscroll-x-contain"
      >
        <table className="w-full table-fixed border-separate border-spacing-0 text-sm">
          <colgroup>
            <col style={{ width: "150px" }} />
            <col />
          </colgroup>

          <thead>
            <tr>
              <th className="sticky left-0 top-0 z-30 border-b border-r border-border bg-muted px-3 py-3 text-left font-medium text-foreground sm:px-4">
                Date
              </th>

              <th className="sticky top-0 z-20 border-b border-border bg-muted px-3 py-3 text-left font-medium text-foreground sm:px-4">
                Daily Progress
              </th>
            </tr>
          </thead>

          <tbody>
            {days.map((day) => (
              <tr
                key={dateKey(day.date)}
                className="hover:bg-muted/20"
              >
                <td className="sticky left-0 z-10 border-b border-r border-border bg-card px-3 py-3 align-top font-medium text-foreground sm:px-4">
                  {formatDate(day.date)}
                </td>

                <td className="min-w-0 border-b border-border px-3 py-3 align-top sm:px-4">
                  <div className="min-w-0 max-w-full break-words [overflow-wrap:anywhere]">
                    <DailyProgressCell
                      progresses={day.progresses}
                      batches={batches}
                    />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* MAIN                                                                       */
/* -------------------------------------------------------------------------- */

export default function StudentMonthProgressTable({
  studentId,
  year,
  month,
  batches,
}: Props) {
  const [open, setOpen] = React.useState(false);

  const [monthProgress, setMonthProgress] =
    React.useState<StudentMonthProgressDay[] | null>(null);

  const [loading, setLoading] = React.useState(false);

  const [error, setError] = React.useState<string | null>(null);

  const loadingRef = React.useRef(false);

  const loadProgress = React.useCallback(async () => {
    if (monthProgress !== null || loadingRef.current) {
      return;
    }

    loadingRef.current = true;
    setLoading(true);
    setError(null);

    try {
      const result = await fetchStudentMonthProgress({
        studentId,
        year,
        month,
      });

      setMonthProgress(result);
    } catch (error) {
      console.error(
        "Failed to load student month progress:",
        error
      );

      setError("Failed to load progress.");
    } finally {
      loadingRef.current = false;
      setLoading(false);
    }
  }, [studentId, year, month, monthProgress]);

  const handleToggle = () => {
    const nextOpen = !open;

    setOpen(nextOpen);

    if (nextOpen && monthProgress === null) {
      void loadProgress();
    }
  };

  return (
    <section className="w-full min-w-0 overflow-hidden rounded-xl border border-border bg-card">
      {/* HEADER */}

      <button
        type="button"
        onClick={handleToggle}
        aria-expanded={open}
        className="flex min-h-14 w-full items-center justify-between gap-3 px-3 py-3 text-left transition-colors hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:px-4"
      >
        <div className="flex min-w-0 items-center gap-2">
          <ChevronDown
            className={`size-4 shrink-0 text-muted-foreground transition-transform ${
              open ? "rotate-180" : ""
            }`}
          />

          <div className="min-w-0">
            <h2 className="font-semibold text-foreground">
              Progress
            </h2>

            <p className="mt-0.5 text-xs text-muted-foreground">
              {batches.length}{" "}
              {batches.length === 1 ? "batch" : "batches"}
            </p>
          </div>
        </div>

        {loading && (
          <span className="inline-flex shrink-0 items-center gap-1.5 text-xs text-muted-foreground">
            <Loader2 className="size-3.5 animate-spin" />
            Loading
          </span>
        )}
      </button>

      {/* CONTENT */}

      {open && (
        <div className="min-w-0 border-t border-border">
          {/* ERROR */}

          {error ? (
            <div className="px-3 py-5 text-sm text-destructive sm:px-4">
              {error}
            </div>
          ) : loading && monthProgress === null ? (
            /* LOADING */

            <div className="flex items-center justify-center gap-2 px-4 py-10 text-sm text-muted-foreground">
              <Loader2 className="size-4 animate-spin" />
              Loading progress...
            </div>
          ) : monthProgress !== null &&
            monthProgress.length === 0 ? (
            /* NO MONTH DATA */

            <div className="px-4 py-10 text-center text-sm text-muted-foreground">
              No progress for this month.
            </div>
          ) : (
            /* PROGRESS */

            <div className="min-w-0 p-3 sm:p-4">
              {/* MOBILE */}

              <div className="space-y-3 md:hidden">
                {monthProgress?.map((day) => (
                  <MobileProgressCard
                    key={dateKey(day.date)}
                    day={day}
                    batches={batches}
                  />
                ))}
              </div>

              {/* DESKTOP */}

              <DesktopProgressTable
                days={monthProgress ?? []}
                batches={batches}
              />
            </div>
          )}
        </div>
      )}
    </section>
  );
}
