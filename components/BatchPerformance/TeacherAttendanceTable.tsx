"use client";

import * as React from "react";

import type {
  AttendanceStatus,
  TeacherPerformance,
} from "@/app/ServerActions/batchPerformance/types";

type Props = {
  teachers: TeacherPerformance[];
  days: string[];
};

const TEACHER_WIDTH = 132;
const COUNT_WIDTH = 84;
const DAY_WIDTH = 42;

function shortDate(date: string) {
  return Number(date.slice(8, 10)).toString();
}

function StatusCell({
  status,
}: {
  status: AttendanceStatus;
}) {
  if (status === "PRESENT") {
    return (
      <span
        title="Present"
        aria-label="Present"
        className="font-semibold text-emerald-600 dark:text-emerald-400"
      >
        P
      </span>
    );
  }

  if (status === "ABSENT") {
    return (
      <span
        title="Absent"
        aria-label="Absent"
        className="font-semibold text-destructive"
      >
        A
      </span>
    );
  }

  if (status === "LEAVE") {
    return (
      <span
        title="Leave"
        aria-label="Leave"
        className="font-semibold text-amber-600 dark:text-amber-400"
      >
        L
      </span>
    );
  }

  return (
    <span
      title="Not marked"
      aria-label="Not marked"
      className="text-muted-foreground"
    >
      —
    </span>
  );
}

export default function TeacherAttendanceTable({
  teachers,
  days,
}: Props) {
  const scrollRef =
    React.useRef<HTMLDivElement>(null);

  const dragRef = React.useRef<{
    startX: number;
    scrollLeft: number;
  } | null>(null);

  const [isDragging, setIsDragging] =
    React.useState(false);

  /*
   * Mouse dragging is only enabled on devices
   * that have a fine pointer and hover support.
   *
   * Touch devices are left completely to the
   * browser's native scrolling behavior.
   */
  const [canUseMouseDrag, setCanUseMouseDrag] =
    React.useState(false);

  /*
   * Detect desktop/laptop pointer capability.
   */
  React.useEffect(() => {
    const mediaQuery = window.matchMedia(
      "(hover: hover) and (pointer: fine)"
    );

    const update = () => {
      setCanUseMouseDrag(mediaQuery.matches);
    };

    update();

    mediaQuery.addEventListener(
      "change",
      update
    );

    return () => {
      mediaQuery.removeEventListener(
        "change",
        update
      );
    };
  }, []);

  /*
   * Calculate required table width.
   */
  const tableWidth =
    TEACHER_WIDTH +
    COUNT_WIDTH +
    days.length * DAY_WIDTH;

  /*
   * Start mouse drag.
   *
   * This is deliberately a MouseEvent instead
   * of PointerEvent so touch is never involved.
   */
  function handleMouseDown(
    event: React.MouseEvent<HTMLDivElement>
  ) {
    if (!canUseMouseDrag) {
      return;
    }

    if (event.button !== 0) {
      return;
    }

    const element = event.currentTarget;

    /*
     * Nothing to scroll.
     */
    if (element.scrollWidth <= element.clientWidth) {
      return;
    }

    dragRef.current = {
      startX: event.clientX,
      scrollLeft: element.scrollLeft,
    };

    setIsDragging(true);

    event.preventDefault();
  }

  /*
   * Move table horizontally while dragging.
   */
  function handleMouseMove(
    event: React.MouseEvent<HTMLDivElement>
  ) {
    if (!canUseMouseDrag) {
      return;
    }

    const drag = dragRef.current;

    if (!drag) {
      return;
    }

    const element = event.currentTarget;

    const distance =
      event.clientX - drag.startX;

    element.scrollLeft =
      drag.scrollLeft - distance;

    event.preventDefault();
  }

  /*
   * Stop dragging.
   */
  function stopMouseDragging() {
    if (!dragRef.current) {
      return;
    }

    dragRef.current = null;
    setIsDragging(false);
  }

  return (
    <section className="w-full min-w-0 overflow-hidden rounded-xl border border-border bg-card">
      {/* Header */}
      <div className="border-b border-border px-4 py-4">
        <h2 className="font-semibold text-foreground">
          Teacher Attendance
        </h2>

        <p className="mt-1 text-sm text-muted-foreground">
          Daily teacher attendance for the selected month.
        </p>
      </div>

      {/* Horizontal scroll container */}
      <div
        ref={scrollRef}
        data-horizontal-scroll="true" 
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={stopMouseDragging}
        onMouseLeave={stopMouseDragging}
        onDragStart={(event) => {
          if (canUseMouseDrag) {
            event.preventDefault();
          }
        }}
        tabIndex={0}
        aria-label="Teacher attendance table"
        className={`w-full min-w-0 overflow-x-auto overscroll-x-contain ${
          canUseMouseDrag
            ? isDragging
              ? "cursor-grabbing select-none"
              : "cursor-grab"
            : ""
        }`}
        style={{
          userSelect: isDragging
            ? "none"
            : "auto",
        }}
      >
        <table
          className="border-separate border-spacing-0 text-sm"
          style={{
            width: `${tableWidth}px`,
            minWidth: `${tableWidth}px`,
            tableLayout: "fixed",
          }}
        >
          <colgroup>
            <col
              style={{
                width: `${TEACHER_WIDTH}px`,
              }}
            />

            <col
              style={{
                width: `${COUNT_WIDTH}px`,
              }}
            />

            {days.map((day) => (
              <col
                key={day}
                style={{
                  width: `${DAY_WIDTH}px`,
                }}
              />
            ))}
          </colgroup>

          <thead>
            <tr>
              {/* Teacher */}
              <th className="sticky left-0 top-0 z-30 border-b border-r border-border bg-muted px-3 py-3 text-left font-medium text-foreground">
                Teacher
              </th>

              {/* Present / Eligible */}
              <th
                title="Present / Eligible"
                className="sticky top-0 z-20 border-b border-r border-border bg-muted px-1 py-3 text-center font-medium text-foreground lg:left-[132px] lg:z-30"
              >
                <span className="text-xs leading-tight">
                  P / E
                </span>
              </th>

              {/* Days */}
              {days.map((day) => (
                <th
                  key={day}
                  title={day}
                  className="sticky top-0 z-20 border-b border-border bg-muted px-1 py-3 text-center text-xs font-medium text-foreground"
                >
                  {shortDate(day)}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {teachers.length === 0 ? (
              <tr>
                <td
                  colSpan={days.length + 2}
                  className="border-b border-border px-4 py-8 text-center text-muted-foreground"
                >
                  No teachers available.
                </td>
              </tr>
            ) : (
              teachers.map((teacher) => (
                <tr key={teacher.id}>
                  {/* Teacher name */}
                  <td
                    title={teacher.name}
                    className="sticky left-0 z-10 border-b border-r border-border bg-card px-3 py-3 font-medium text-foreground"
                  >
                    <span className="block">
                      {teacher.name}
                    </span>
                  </td>

                  {/* Present / Eligible */}
                  <td className="border-b border-r border-border bg-card px-1 py-3 text-center font-medium text-foreground lg:sticky lg:left-[132px] lg:z-10">
                    <span className="whitespace-nowrap text-xs">
                      {teacher.presentDays}/
                      {teacher.eligibleDays}
                    </span>
                  </td>

                  {/* Daily attendance */}
                  {days.map((day) => (
                    <td
                      key={`${teacher.id}-${day}`}
                      className="border-b border-border px-1 py-3 text-center"
                    >
                      <StatusCell
                        status={
                          teacher.attendance[day] ?? null
                        }
                      />
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-border px-4 py-2 text-xs text-muted-foreground">
        <span>
          <strong className="text-emerald-600 dark:text-emerald-400">
            P
          </strong>{" "}
          Present
        </span>

        <span>
          <strong className="text-destructive">
            A
          </strong>{" "}
          Absent
        </span>

        <span>
          <strong className="text-amber-600 dark:text-amber-400">
            L
          </strong>{" "}
          Leave
        </span>

        <span>— Not marked</span>
      </div>
    </section>
  );
} 