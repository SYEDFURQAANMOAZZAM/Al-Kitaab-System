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

export default function StudentAttendanceTable({
  students,
  days,
}: Props) {
  const [search, setSearch] =
    React.useState("");

  const filteredStudents =
    React.useMemo(() => {
      const query =
        search.trim().toLowerCase();

      if (!query) {
        return students;
      }

      return [...students].sort((a, b) => {
        const aName =
          a.name.toLowerCase();

        const bName =
          b.name.toLowerCase();

        const aStarts =
          aName.startsWith(query);

        const bStarts =
          bName.startsWith(query);

        if (aStarts && !bStarts) {
          return -1;
        }

        if (!aStarts && bStarts) {
          return 1;
        }

        const aIndex =
          aName.indexOf(query);

        const bIndex =
          bName.indexOf(query);

        if (aIndex !== bIndex) {
          return aIndex - bIndex;
        }

        return aName.localeCompare(
          bName
        );
      });
    }, [students, search]);

  return (
    <section className="min-w-0 w-full overflow-hidden rounded-xl border border-border bg-card">
      <div className="flex min-w-0 flex-col gap-3 border-b border-border px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h2 className="font-semibold text-foreground">
            Student Attendance
          </h2>

          <p className="mt-1 text-sm text-muted-foreground">
            Monthly attendance and daily status.
          </p>
        </div>

        <div className="relative w-full shrink-0 sm:w-[240px]">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />

          <Input
            value={search}
            onChange={(event) =>
              setSearch(event.target.value)
            }
            placeholder="Search student..."
            className="w-full pl-9"
          />
        </div>
      </div>

      <div className="w-full min-w-0 overflow-x-auto">
        <table className="min-w-max border-separate border-spacing-0 text-sm">
          <thead>
            <tr>
              <th className="sticky left-0 top-0 z-30 min-w-[120px] border-b border-r border-border bg-muted px-4 py-3 text-left font-medium text-foreground">
                Date
              </th>

              {filteredStudents.map(
                (student) => (
                  <th
                    key={student.id}
                    className="sticky top-0 z-20 min-w-[125px] border-b border-border bg-muted px-3 py-3 text-center"
                  >
                    <div className="font-semibold text-foreground">
                      {student.name}
                    </div>

                    <div className="mt-0.5 text-xs font-normal text-muted-foreground">
                      {student.presentDays}/
                      {student.eligibleDays}
                    </div>
                  </th>
                )
              )}
            </tr>
          </thead>

          <tbody>
            {days.map((day) => (
              <tr key={day}>
                <td className="sticky left-0 z-10 min-w-[120px] border-b border-r border-border bg-card px-4 py-3 font-medium text-foreground">
                  {shortDate(day)}
                </td>

                {filteredStudents.map(
                  (student) => (
                    <td
                      key={`${day}-${student.id}`}
                      className="min-w-[125px] border-b border-border px-3 py-3 text-center"
                    >
                      <StatusCell
                        status={
                          student
                            .attendance[
                            day
                          ] ?? null
                        }
                      />
                    </td>
                  )
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}