
"use client";

import * as React from "react";
import { Search } from "lucide-react";

import { Input } from "@/components/ui/input";

import type {
  AttendanceStatus,
  StudentPerformance,
} from "@/app/ServerActions/batchPerformance/types";

type Props = {
  students: StudentPerformance[];
  days: string[];
};

const DATE_COLUMN_WIDTH = 120;
const STUDENT_MIN_WIDTH = 125;

function shortDate(date: string) {
  return new Date(`${date}T00:00:00Z`).toLocaleDateString(
    "en-US",
    {
      day: "numeric",
      month: "short",
      timeZone: "UTC",
    }
  );
}

function StatusCell({
  status,
}: {
  status: AttendanceStatus;
}) {
  if (status === "PRESENT") {
    return (
      <span className="font-medium text-emerald-600 dark:text-emerald-400">
        Present
      </span>
    );
  }

  if (status === "ABSENT") {
    return (
      <span className="font-medium text-destructive">
        Absent
      </span>
    );
  }

  if (status === "LEAVE") {
    return (
      <span className="font-medium text-amber-600 dark:text-amber-400">
        Leave
      </span>
    );
  }

  return (
    <span className="text-muted-foreground">—</span>
  );
}

export default function StudentAttendanceTable({
  students,
  days,
}: Props) {
  const [search, setSearch] = React.useState("");
  const [containerWidth, setContainerWidth] = React.useState(0);
  const [isDragging, setIsDragging] = React.useState(false);

  const scrollContainerRef = React.useRef<HTMLDivElement>(null);

  const dragRef = React.useRef<{
    pointerId: number;
    startX: number;
    scrollLeft: number;
  } | null>(null);

  // Measure available table width.
  React.useEffect(() => {
    const element = scrollContainerRef.current;
    if (!element) return;

    const updateWidth = () => {
      setContainerWidth(element.clientWidth);
    };

    updateWidth();

    const observer = new ResizeObserver(updateWidth);
    observer.observe(element);

    return () => observer.disconnect();
  }, []);

  // Case-insensitive regex search.
  const searchPattern = React.useMemo(() => {
    const query = search.trim();

    if (!query) {
      return { regex: null, error: false };
    }

    try {
      return {
        regex: new RegExp(query, "i"),
        error: false,
      };
    } catch {
      return {
        regex: null,
        error: true,
      };
    }
  }, [search]);

  // Show only matching student names.
  const filteredStudents = React.useMemo(() => {
    if (searchPattern.error) return [];
    if (!searchPattern.regex) return students;

    return students.filter((student) =>
      searchPattern.regex!.test(student.name)
    );
  }, [students, searchPattern]);

  // Responsive column widths.
  const studentCount = filteredStudents.length;

  const minTableWidth =
    DATE_COLUMN_WIDTH + studentCount * STUDENT_MIN_WIDTH;

  const canFit =
    containerWidth > 0 &&
    containerWidth >= minTableWidth;

  const studentColumnWidth =
    studentCount === 0
      ? 0
      : canFit
        ? (containerWidth - DATE_COLUMN_WIDTH) / studentCount
        : STUDENT_MIN_WIDTH;

  const tableWidth = canFit
    ? "100%"
    : `${minTableWidth}px`;

  // Start mouse dragging.
  function handlePointerDown(
    event: React.PointerEvent<HTMLDivElement>
  ) {
    // Only use left-click dragging with a mouse.
    if (
      event.pointerType !== "mouse" ||
      event.button !== 0
    ) {
      return;
    }

    const element = event.currentTarget;

    dragRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      scrollLeft: element.scrollLeft,
    };

    element.setPointerCapture(event.pointerId);
    setIsDragging(true);

    // Prevent text selection while dragging.
    event.preventDefault();
  }

  // Move table horizontally while dragging.
  function handlePointerMove(
    event: React.PointerEvent<HTMLDivElement>
  ) {
    const drag = dragRef.current;

    if (
      !drag ||
      drag.pointerId !== event.pointerId
    ) {
      return;
    }

    const element = event.currentTarget;
    const distance = event.clientX - drag.startX;

    element.scrollLeft = drag.scrollLeft - distance;
    event.preventDefault();
  }

  // Stop dragging.
  function stopDragging() {
    dragRef.current = null;
    setIsDragging(false);
  }

  return (
    <section className="min-w-0 w-full overflow-hidden rounded-xl border border-border bg-card">
      {/* Header */}
      <div className="flex min-w-0 flex-col gap-3 border-b border-border px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h2 className="font-semibold text-foreground">
            Student Attendance
          </h2>

          <p className="mt-1 text-sm text-muted-foreground">
            Monthly attendance and daily status.
          </p>
        </div>

        {/* Search */}
        <div className="relative w-full shrink-0 sm:w-[240px]">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />

          <Input
            value={search}
            onChange={(event) =>
              setSearch(event.target.value)
            }
            placeholder="Search student..."
            aria-label="Search students by regex"
            aria-invalid={searchPattern.error}
            className="w-full pl-9"
          />
        </div>
      </div>

      {searchPattern.error && (
        <p
          className="px-4 pt-3 text-sm text-destructive"
          role="alert"
        >
          Invalid regular expression.
        </p>
      )}

      {/* Drag-to-scroll table */}
      <div
        ref={scrollContainerRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={stopDragging}
        onPointerCancel={stopDragging}
        onLostPointerCapture={stopDragging}
        tabIndex={0}
        aria-label="Student attendance table. Hold the left mouse button and drag horizontally to scroll."
        className={`w-full min-w-0 overflow-x-auto overscroll-x-contain ${
          isDragging
            ? "cursor-grabbing select-none"
            : "cursor-grab"
        }`}
        style={{
          userSelect: isDragging ? "none" : "auto",
        }}
      >
        <table
          className="border-separate border-spacing-0 text-sm"
          style={{
            width: tableWidth,
            tableLayout: "fixed",
          }}
        >
          <colgroup>
            <col
              style={{
                width: `${DATE_COLUMN_WIDTH}px`,
              }}
            />

            {filteredStudents.map((student) => (
              <col
                key={student.id}
                style={{
                  width: `${studentColumnWidth}px`,
                }}
              />
            ))}
          </colgroup>

          <thead>
            <tr>
              <th className="sticky left-0 top-0 z-30 border-b border-r border-border bg-muted px-4 py-3 text-left font-medium text-foreground">
                Date
              </th>

              {filteredStudents.map((student) => (
                <th
                  key={student.id}
                  className="sticky top-0 z-20 border-b border-border bg-muted px-3 py-3 text-center"
                >
                  <div className="break-words font-semibold text-foreground">
                    {student.name}
                  </div>

                  <div className="mt-0.5 text-xs font-normal text-muted-foreground">
                    {student.presentDays}/
                    {student.eligibleDays}
                  </div>
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {filteredStudents.length === 0 ? (
              <tr>
                <td
                  colSpan={1}
                  className="border-b border-border px-4 py-8 text-center text-muted-foreground"
                >
                  {searchPattern.error
                    ? "Please enter a valid regex."
                    : search.trim()
                      ? "No students match your search."
                      : "No students available."}
                </td>
              </tr>
            ) : (
              days.map((day) => (
                <tr key={day}>
                  <td className="sticky left-0 z-10 border-b border-r border-border bg-card px-4 py-3 font-medium text-foreground">
                    {shortDate(day)}
                  </td>

                  {filteredStudents.map((student) => (
                    <td
                      key={`${day}-${student.id}`}
                      className="border-b border-border px-3 py-3 text-center"
                    >
                      <StatusCell
                        status={student.attendance[day] ?? null}
                      />
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
