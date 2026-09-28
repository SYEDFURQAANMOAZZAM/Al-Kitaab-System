"use client";

import * as React from "react";
import {
  Check,
  CircleX,
  Clock3,
} from "lucide-react";

import type {
  StudentBatchAttendance,
} from "@/app/ServerActions/studentPerformance/types";

type Props = {
  attendance: StudentBatchAttendance[];
};

type AttendanceStatusType =
  | "PRESENT"
  | "ABSENT"
  | "LEAVE"
  | null;

/* -------------------------------------------------------------------------- */
/* DATE                                                                       */
/* -------------------------------------------------------------------------- */

function formatDate(date: string) {
  return new Date(`${date}T00:00:00Z`).toLocaleDateString(
    "en-US",
    {
      weekday: "short",
      day: "2-digit",
      month: "short",
      year: "numeric",
      timeZone: "UTC",
    },
  );
}

/* -------------------------------------------------------------------------- */
/* STATUS                                                                     */
/* -------------------------------------------------------------------------- */

function Status({
  status,
}: {
  status: AttendanceStatusType;
}) {
  if (!status) {
    return (
      <span className="text-muted-foreground">
        -
      </span>
    );
  }

  const styles = {
    PRESENT:
      "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
    LEAVE:
      "bg-amber-500/10 text-amber-600 dark:text-amber-400",
    ABSENT:
      "bg-destructive/10 text-destructive",
  };

  const labels = {
    PRESENT: "Present",
    LEAVE: "Leave",
    ABSENT: "Absent",
  };

  const Icon = {
    PRESENT: Check,
    LEAVE: Clock3,
    ABSENT: CircleX,
  }[status];

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${styles[status]}`}
    >
      <Icon className="size-3.5 shrink-0" />
      {labels[status]}
    </span>
  );
}

/* -------------------------------------------------------------------------- */
/* MAIN                                                                       */
/* -------------------------------------------------------------------------- */

export default function StudentAttendanceTables({
  attendance,
}: Props) {
  const dates = Array.from(
    new Set(
      attendance.flatMap((batch) =>
        batch.records.map((record) => record.date),
      ),
    ),
  ).sort();

  const attendanceMaps = attendance.map((batch) => {
    return new Map(
      batch.records.map((record) => [
        record.date,
        record.status,
      ]),
    );
  });

  const totalPresent = attendance.reduce(
    (sum, batch) => sum + batch.presentDays,
    0,
  );

  const totalLeaves = attendance.reduce(
    (sum, batch) => sum + batch.leaveDays,
    0,
  );

  const totalAbsent = attendance.reduce(
    (sum, batch) => sum + batch.absentDays,
    0,
  );

  const totalRecords =
    totalPresent + totalLeaves + totalAbsent;

  /* ------------------------------------------------------------------------ */
  /* DESKTOP SCROLL                                                           */
  /* ------------------------------------------------------------------------ */

  const scrollRef = React.useRef<HTMLDivElement>(null);

  const isScrollable = attendance.length > 4;

  const drag = React.useRef({
    active: false,
    startX: 0,
    scrollLeft: 0,
  });

  const handleMouseDown = (
    e: React.MouseEvent<HTMLDivElement>,
  ) => {
    if (e.button !== 0 || !isScrollable) return;

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
      container.style.cursor = isScrollable ? "grab" : "";
      container.style.userSelect = "";
    }
  };

  /* ------------------------------------------------------------------------ */
  /* COLUMN WIDTH                                                             */
  /* ------------------------------------------------------------------------ */

  const columnWidth = isScrollable ? "180px" : `${100 / (attendance.length + 1)}%`;

  return (
    <section className="w-full min-w-0 space-y-4">
      {/* SECTION HEADER */}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-foreground">
            Attendance
          </h2>

          <p className="mt-1 text-sm text-muted-foreground">
            Attendance for each enrolled batch.
          </p>
        </div>

        {totalRecords > 0 && (
          <div className="flex flex-wrap gap-2 text-xs">
            <span className="rounded-full bg-emerald-500/10 px-2.5 py-1 font-medium text-emerald-600 dark:text-emerald-400">
              {totalPresent} Present
            </span>

            <span className="rounded-full bg-amber-500/10 px-2.5 py-1 font-medium text-amber-600 dark:text-amber-400">
              {totalLeaves} Leaves
            </span>

            <span className="rounded-full bg-destructive/10 px-2.5 py-1 font-medium text-destructive">
              {totalAbsent} Absent
            </span>
          </div>
        )}
      </div>

      {/* NO DATA */}

      {dates.length === 0 || attendance.length === 0 ? (
        <div className="rounded-xl border border-border bg-card px-4 py-8 text-center text-sm text-muted-foreground">
          No data for this month.
        </div>
      ) : (
        <>
          {/* ---------------------------------------------------------------- */}
          {/* MOBILE: DATE CARDS                                               */}
          {/* ---------------------------------------------------------------- */}

          <div className="space-y-3 md:hidden">
            {dates.map((date) => (
              <div
                key={date}
                className="overflow-hidden rounded-xl border border-border bg-card"
              >
                <div className="border-b border-border bg-muted/40 px-3 py-2.5">
                  <span className="text-sm font-semibold text-foreground">
                    {formatDate(date)}
                  </span>
                </div>

                <div className="divide-y divide-border">
                  {attendance.map((batch, index) => {
                    const status =
                      attendanceMaps[index].get(date) ?? null;

                    return (
                      <div
                        key={batch.batchId}
                        className="flex min-w-0 items-center justify-between gap-3 px-3 py-3"
                      >
                        <span className="min-w-0 truncate text-sm text-foreground">
                          {batch.batchName}
                        </span>

                        <div className="shrink-0">
                          <Status status={status} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          {/* ---------------------------------------------------------------- */}
          {/* TABLET / DESKTOP                                                 */}
          {/* ---------------------------------------------------------------- */}

          <div className="hidden w-full min-w-0 max-w-full overflow-hidden rounded-xl border border-border bg-card md:block">
            <div
              ref={scrollRef}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={stopDragging}
              onMouseLeave={stopDragging}
              onDragStart={(e) => e.preventDefault()}
              className={`w-full min-w-0 max-w-full overflow-x-auto overscroll-x-contain ${
                isScrollable ? "cursor-grab" : ""
              }`}
            >
              <table
                className="table-fixed border-separate border-spacing-0 text-sm"
                style={{
                  width: isScrollable
                    ? `${(attendance.length + 1) * 180}px`
                    : "100%",
                }}
              >
                <colgroup>
                  <col style={{ width: columnWidth }} />

                  {attendance.map((batch) => (
                    <col
                      key={batch.batchId}
                      style={{ width: columnWidth }}
                    />
                  ))}
                </colgroup>

                <thead>
                  <tr className="bg-muted/50">
                    <th className="sticky left-0 top-0 z-30 border-b border-r border-border bg-muted/50 px-3 py-3 text-left font-semibold text-foreground">
                      Date
                    </th>

                    {attendance.map((batch) => {
                      const count =
                        batch.presentDays +
                        batch.leaveDays +
                        batch.absentDays;

                      return (
                        <th
                          key={batch.batchId}
                          className="sticky top-0 z-20 border-b border-r border-border bg-muted/50 px-3 py-3 text-left align-top font-semibold text-foreground last:border-r-0"
                        >
                          <div className="break-words [overflow-wrap:anywhere]">
                            {batch.batchName}
                          </div>

                          <div className="mt-1 text-xs font-normal text-muted-foreground">
                            {count > 0
                              ? `${batch.presentDays}P · ${batch.leaveDays}L · ${batch.absentDays}A`
                              : "No attendance"}
                          </div>
                        </th>
                      );
                    })}
                  </tr>
                </thead>

                <tbody>
                  {dates.map((date) => (
                    <tr
                      key={date}
                      className="hover:bg-muted/20"
                    >
                      <td className="sticky left-0 z-10 border-b border-r border-border bg-card px-3 py-3 align-top font-medium text-foreground">
                        <span className="block break-words [overflow-wrap:anywhere]">
                          {formatDate(date)}
                        </span>
                      </td>

                      {attendance.map((batch, index) => {
                        const status =
                          attendanceMaps[index].get(date) ?? null;

                        return (
                          <td
                            key={batch.batchId}
                            className="border-b border-r border-border px-3 py-3 align-top last:border-r-0"
                          >
                            <Status status={status} />
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </section>
  );
}