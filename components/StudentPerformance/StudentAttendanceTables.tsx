
"use client";

import * as React from "react";
import { Check, CircleX, Clock3 } from "lucide-react";

import type {
  StudentBatchAttendance,
} from "@/app/ServerActions/studentPerformance/types";

type Props = {
  attendance: StudentBatchAttendance[];
};

type AttendanceStatusType = "PRESENT" | "ABSENT" | "LEAVE" | null;

function formatDate(date: string) {
  return new Date(`${date}T00:00:00Z`).toLocaleDateString("en-US", {
    weekday: "short",
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
}

function getDay(date: string) {
  return new Date(`${date}T00:00:00Z`).getUTCDate();
}

function Status({ status }: { status: AttendanceStatusType }) {
  if (!status) {
    return <span className="text-xs text-muted-foreground">-</span>;
  }

  const config = {
    PRESENT: {
      label: "Present",
      short: "P",
      Icon: Check,
      style: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
    },
    LEAVE: {
      label: "Leave",
      short: "L",
      Icon: Clock3,
      style: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
    },
    ABSENT: {
      label: "Absent",
      short: "A",
      Icon: CircleX,
      style: "bg-destructive/10 text-destructive",
    },
  }[status];

  const { Icon, label, short, style } = config;

  return (
    <span
      title={label}
      aria-label={label}
      className={`inline-flex items-center justify-center gap-1 rounded-md px-1.5 py-1 text-xs font-semibold ${style}`}
    >
      <Icon className="size-3.5 shrink-0" />
      <span>{short}</span>
    </span>
  );
}

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

  const attendanceMaps = attendance.map(
    (batch) =>
      new Map(
        batch.records.map((record) => [
          record.date,
          record.status,
        ]),
      ),
  );

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

  const totalRecords = totalPresent + totalLeaves + totalAbsent;

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
    container.scrollLeft = drag.current.scrollLeft - deltaX;
  };

  const stopDragging = () => {
    const container = scrollRef.current;
    drag.current.active = false;

    if (container) {
      container.style.cursor = isScrollable ? "grab" : "";
      container.style.userSelect = "";
    }
  };

  return (
    <section className="w-full min-w-0 space-y-4">
      {/* Header */}
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

      {dates.length === 0 || attendance.length === 0 ? (
        <div className="rounded-xl border border-border bg-card px-4 py-8 text-center text-sm text-muted-foreground">
          No data for this month.
        </div>
      ) : (
        <div className="space-y-3">
          {/* Batch reference */}
          <div className="rounded-xl border border-border bg-card p-3">
            <p className="mb-2 text-xs font-semibold text-muted-foreground">
              BATCH REFERENCE
            </p>

            <div className="flex flex-wrap gap-x-4 gap-y-2">
              {attendance.map((batch, index) => (
                <div
                  key={batch.batchId}
                  className="flex min-w-0 items-center gap-2 text-xs"
                >
                  <span className="flex size-6 shrink-0 items-center justify-center rounded-md bg-muted font-semibold text-foreground">
                    B{index + 1}
                  </span>
                  <span className="max-w-[180px] truncate text-foreground">
                    {batch.batchName}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Same compact table on mobile and desktop */}
          <div className="w-full min-w-0 overflow-hidden rounded-xl border border-border bg-card">
            <div
              ref={scrollRef}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={stopDragging}
              onMouseLeave={stopDragging}
              onDragStart={(e) => e.preventDefault()}
              className={`w-full max-w-full overflow-x-auto overscroll-x-contain ${
                isScrollable ? "cursor-grab" : ""
              }`}
            >
              <table
                className="w-full table-fixed border-separate border-spacing-0 text-center text-xs sm:text-sm"
                style={{
                  minWidth: `${64 + attendance.length * 76}px`,
                }}
              >
                <colgroup>
                  <col style={{ width: "64px" }} />
                  {attendance.map((batch) => (
                    <col key={batch.batchId} style={{ width: "76px" }} />
                  ))}
                </colgroup>

                <thead>
                  <tr className="bg-muted/50">
                    <th className="sticky left-0 top-0 z-30 border-b border-r border-border bg-muted/90 px-2 py-2.5 font-semibold text-foreground">
                      Day
                    </th>

                    {attendance.map((batch, index) => {
                      const count =
                        batch.presentDays +
                        batch.leaveDays +
                        batch.absentDays;

                      return (
                        <th
                          key={batch.batchId}
                          title={batch.batchName}
                          className="sticky top-0 z-20 border-b border-r border-border bg-muted/90 px-1 py-2.5 font-semibold text-foreground last:border-r-0"
                        >
                          <div>B{index + 1}</div>
                          <div className="mt-1 text-[10px] font-normal text-muted-foreground sm:text-xs">
                            {count > 0
                              ? `${batch.presentDays}P · ${batch.leaveDays}L · ${batch.absentDays}A`
                              : "—"}
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
                      <td
                        title={formatDate(date)}
                        className="sticky left-0 z-10 border-b border-r border-border bg-card px-2 py-2.5 font-semibold text-foreground"
                      >
                        {getDay(date)}
                      </td>

                      {attendance.map((batch, index) => {
                        const status =
                          (attendanceMaps[index].get(
                            date,
                          ) as AttendanceStatusType | undefined) ??
                          null;

                        return (
                          <td
                            key={batch.batchId}
                            className="border-b border-r border-border px-1 py-2 last:border-r-0"
                          >
                            <div className="flex justify-center">
                              <Status status={status} />
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Legend */}
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 px-1 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <span className="flex size-5 items-center justify-center rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                <Check className="size-3.5" />
              </span>
              Present
            </span>

            <span className="flex items-center gap-1.5">
              <span className="flex size-5 items-center justify-center rounded bg-amber-500/10 text-amber-600 dark:text-amber-400">
                <Clock3 className="size-3.5" />
              </span>
              Leave
            </span>

            <span className="flex items-center gap-1.5">
              <span className="flex size-5 items-center justify-center rounded bg-destructive/10 text-destructive">
                <CircleX className="size-3.5" />
              </span>
              Absent
            </span>

            <span className="flex items-center gap-1.5">
              <span className="flex size-5 items-center justify-center rounded border border-border text-muted-foreground">
                -
              </span>
              No record
            </span>
          </div>
        </div>
      )}
    </section>
  );
}
