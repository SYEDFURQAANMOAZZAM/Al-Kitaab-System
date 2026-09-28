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

function shortDate(date: string) {
  return new Date(
    `${date}T00:00:00Z`
  ).toLocaleDateString("en-US", {
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  });
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
    <span className="text-muted-foreground">
      —
    </span>
  );
}

export default function TeacherAttendanceTable({
  teachers,
  days,
}: Props) {
  return (
    <section className="min-w-0 w-full overflow-hidden rounded-xl border border-border bg-card">
      <div className="border-b border-border px-4 py-4">
        <h2 className="font-semibold text-foreground">
          Teacher Attendance
        </h2>

        <p className="mt-1 text-sm text-muted-foreground">
          Daily teacher attendance for the selected
          month.
        </p>
      </div>

      <div className="w-full min-w-0 overflow-x-auto">
        <table className="min-w-max border-separate border-spacing-0 text-sm">
          <thead>
            <tr>
              <th className="sticky left-0 top-0 z-30 min-w-[150px] border-b border-r border-border bg-muted px-4 py-3 text-left font-medium text-foreground">
                Teacher
              </th>

              <th className="sticky left-[150px] top-0 z-30 min-w-[100px] border-b border-r border-border bg-muted px-4 py-3 text-left font-medium text-foreground">
                Percentage
              </th>

              {days.map((day) => (
                <th
                  key={day}
                  className="sticky top-0 z-20 min-w-[100px] border-b border-border bg-muted px-3 py-3 text-center font-medium text-foreground"
                >
                  {shortDate(day)}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {teachers.map((teacher) => (
              <tr key={teacher.id}>
                <td className="sticky left-0 z-10 min-w-[150px] border-b border-r border-border bg-card px-4 py-3 font-medium text-foreground">
                  {teacher.name}
                </td>

                <td className="sticky left-[150px] z-10 min-w-[100px] border-b border-r border-border bg-card px-4 py-3 font-medium text-foreground">
                  {teacher.presentDays}/
                  {teacher.eligibleDays}
                </td>

                {days.map((day) => (
                  <td
                    key={`${teacher.id}-${day}`}
                    className="min-w-[100px] border-b border-border px-3 py-3 text-center"
                  >
                    <StatusCell
                      status={
                        teacher.attendance[
                          day
                        ] ?? null
                      }
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}