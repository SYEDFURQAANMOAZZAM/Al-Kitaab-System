"use client";

import * as React from "react";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { Badge } from "@/components/ui/badge";
import type {
  TeacherPerformanceData,
  TeacherAttendanceStatus,
} from "./types";

type Props = {
  data: TeacherPerformanceData;
  month: number;
  year: number;
};

function getIndiaToday() {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "numeric",
    day: "numeric",
  }).formatToParts(new Date());

  const get = (type: string) =>
    Number(parts.find((part) => part.type === type)?.value);

  return {
    year: get("year"),
    month: get("month"),
    day: get("day"),
  };
}

const statusLabels: Record<
  Exclude<TeacherAttendanceStatus, null>,
  string
> = {
  PRESENT: "P",
  ABSENT: "A",
  LEAVE: "L",
};

function StatusCell({
  status,
}: {
  status: TeacherAttendanceStatus;
}) {
  if (!status) {
    return <span className="text-muted-foreground">—</span>;
  }

  const styles: Record<
    Exclude<TeacherAttendanceStatus, null>,
    string
  > = {
    PRESENT: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
    ABSENT: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
    LEAVE: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
  };

  return (
    <Badge
      variant="outline"
      className={`min-w-7 justify-center border-0 px-1.5 ${styles[status]}`}
    >
      {statusLabels[status]}
    </Badge>
  );
}

export default function TeacherPerformanceTable({
  data,
  month,
  year,
}: Props) {
  const today = getIndiaToday();

  const isFutureMonth =
    year > today.year ||
    (year === today.year && month > today.month);

  const isCurrentMonth =
    year === today.year && month === today.month;

  const daysInMonth = new Date(year, month, 0).getDate();

  const totalDates = isFutureMonth
    ? 0
    : isCurrentMonth
      ? today.day
      : daysInMonth;

  const dates = Array.from(
    { length: totalDates },
    (_, index) => index + 1
  );

  const attendanceByDate = React.useMemo(() => {
    const map = new Map<
      number,
      Record<string, TeacherAttendanceStatus>
    >();

    for (const record of data.attendance) {
      map.set(record.date, record.batchAttendance);
    }

    return map;
  }, [data.attendance]);

  const batches = data.batches;

  const batchColumnWidth =
    batches.length > 0 ? `${100 / (batches.length + 1)}%` : "auto";

  return (
    <div className="space-y-4">
      {/* Batch mapping */}
      {batches.length > 0 && (
        <div className="rounded-lg border bg-card p-3">
          <p className="mb-2 text-sm font-semibold text-foreground">
            Batch Reference
          </p>

          <div className="flex flex-wrap gap-x-4 gap-y-2">
            {batches.map((batch, index) => (
              <div
                key={batch.id}
                className="flex min-w-0 items-center gap-1.5 text-sm"
              >
                <span className="shrink-0 font-semibold text-foreground">
                  B{index + 1} =
                </span>
                <span className="break-words text-muted-foreground">
                  {batch.name}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty states */}
      {batches.length === 0 ? (
        <div className="rounded-lg border bg-card px-4 py-10 text-center">
          <p className="font-medium text-foreground">
            No batches assigned
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            No batch attendance is available for this teacher.
          </p>
        </div>
      ) : isFutureMonth ? (
        <div className="rounded-lg border bg-card px-4 py-10 text-center">
          <p className="font-medium text-foreground">
            No attendance available
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            Attendance cannot be displayed for a future month.
          </p>
        </div>
      ) : (
        <div className="w-full overflow-x-auto rounded-lg border">
          <Table className="w-full table-fixed">
            <TableHeader>
              <TableRow>
                <TableHead
                  className="sticky left-0 z-20 w-12 bg-muted text-center"
                >
                  Date
                </TableHead>

                {batches.map((batch, index) => (
                  <TableHead
                    key={batch.id}
                    className="overflow-hidden bg-muted px-1 text-center"
                    style={{ width: batchColumnWidth }}
                    title={batch.name}
                  >
                    B{index + 1}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>

            <TableBody>
              {dates.map((date) => {
                const dayAttendance = attendanceByDate.get(date);

                return (
                  <TableRow key={date}>
                    <TableCell className="sticky left-0 z-10 bg-card px-1 text-center text-sm font-medium">
                      {date}
                    </TableCell>

                    {batches.map((batch) => (
                      <TableCell
                        key={batch.id}
                        className="px-1 text-center"
                      >
                        <StatusCell
                          status={
                            dayAttendance?.[batch.id] ?? null
                          }
                        />
                      </TableCell>
                    ))}
                  </TableRow>
                );
              })}

              {dates.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={batches.length + 1}
                    className="h-24 text-center text-muted-foreground"
                  >
                    No dates to display.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted-foreground">
        <span className="font-medium text-foreground">Legend:</span>

        <span className="flex items-center gap-1.5">
          <StatusCell status="PRESENT" />
          Present
        </span>

        <span className="flex items-center gap-1.5">
          <StatusCell status="ABSENT" />
          Absent
        </span>

        <span className="flex items-center gap-1.5">
          <StatusCell status="LEAVE" />
          Leave
        </span>

        <span className="flex items-center gap-1.5">
          <span className="text-muted-foreground">—</span>
          No record
        </span>
      </div>
    </div>
  );
}