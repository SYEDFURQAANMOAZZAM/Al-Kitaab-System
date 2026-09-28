import {
  Check,
  X,
} from "lucide-react";

import type {
  BatchAttendanceTakenDay,
} from "@/app/ServerActions/batchPerformance/types";

type Props = {
  days: BatchAttendanceTakenDay[];
};

function formatDate(date: string) {
  return new Date(
    `${date}T00:00:00Z`
  ).toLocaleDateString("en-US", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
}

export default function BatchAttendanceTakenTable({
  days,
}: Props) {
  return (
    <section className="min-w-0 w-full overflow-hidden rounded-xl border border-border bg-card">
      <div className="border-b border-border px-4 py-4">
        <h2 className="font-semibold text-foreground">
          Batch Attendance Taken
        </h2>

        <p className="mt-1 text-sm text-muted-foreground">
          Shows whether attendance was recorded for
          each day.
        </p>
      </div>

      <div className="max-h-[420px] w-full overflow-y-auto">
        <table className="w-full table-fixed text-sm">
          <thead className="sticky top-0 z-10 bg-muted">
            <tr className="border-b border-border">
              <th className="w-1/2 px-4 py-3 text-left font-medium text-foreground">
                Date
              </th>

              <th className="w-1/2 px-4 py-3 text-left font-medium text-foreground">
                Attendance
              </th>
            </tr>
          </thead>

          <tbody>
            {days.map((day) => (
              <tr
                key={day.date}
                className="border-b border-border last:border-0"
              >
                <td className="truncate px-4 py-3 font-medium text-foreground">
                  {formatDate(day.date)}
                </td>

                <td className="px-4 py-3">
                  {day.taken ? (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-1 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                      <Check className="size-3.5" />
                      Taken
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-destructive/10 px-2.5 py-1 text-xs font-medium text-destructive">
                      <X className="size-3.5" />
                      Not taken
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}