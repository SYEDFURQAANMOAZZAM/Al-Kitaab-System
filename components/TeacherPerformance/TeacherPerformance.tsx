"use client";

import {
  usePathname,
  useRouter,
  useSearchParams,
} from "next/navigation";

import {
  CalendarDays,
  CheckCircle2,
  XCircle,
  ClipboardList,
  Users,
} from "lucide-react";

import TeacherPerformanceHeader from "./TeacherPerformanceHeader";
import TeacherPerformanceMonthYear from "./TeacherPerformanceMonthYear";
import TeacherPerformanceTable from "./TeacherPerformanceTable";

import type {
  TeacherPerformanceProps,
} from "./types";

type Props = TeacherPerformanceProps & {
  onExportPdf?: () => void;
  onDelete?: () => void;
};

export default function TeacherPerformance({
  data,
  month,
  year,
  onExportPdf,
  onDelete,
}: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function updatePeriod(nextMonth: number, nextYear: number) {
    const params = new URLSearchParams(searchParams.toString());

    params.set("month", String(nextMonth));
    params.set("year", String(nextYear));

    router.replace(`${pathname}?${params.toString()}`, {
      scroll: false,
    });
  }

  const summary = [
    {
      label: "Assigned Batches",
      value: data.batches.length,
      icon: Users,
      style: "text-foreground",
    },
    {
      label: "Present Days",
      value: data.presentDays,
      icon: CheckCircle2,
      style: "text-green-600 dark:text-green-400",
    },
    {
      label: "Absent Days",
      value: data.absentDays,
      icon: XCircle,
      style: "text-destructive",
    },
    {
      label: "Leaves",
      value: data.leaves,
      icon: CalendarDays,
      style: "text-yellow-600 dark:text-yellow-400",
    },
    {
      label: "Total Days",
      value: data.totalDays,
      icon: ClipboardList,
      style: "text-foreground",
    },
  ];

  return (
    <main className="mx-auto flex w-full max-w-screen-2xl flex-col gap-5 p-3 sm:gap-6 sm:p-5 lg:p-6">
      <TeacherPerformanceHeader
        teacherName={data.teacherName}
        onExportPdf={onExportPdf}
        onDelete={onDelete}
      />

      <TeacherPerformanceMonthYear
        month={month}
        year={year}
        onMonthChange={(nextMonth) =>
          updatePeriod(nextMonth, year)
        }
        onYearChange={(nextYear) =>
          updatePeriod(month, nextYear)
        }
      />

      <section className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-5">
        {summary.map((item) => {
          const Icon = item.icon;

          return (
            <div
              key={item.label}
              className="flex min-w-0 items-center gap-3 rounded-xl border border-border bg-card p-3 sm:p-4"
            >
              <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted">
                <Icon className={`size-4 ${item.style}`} />
              </div>

              <div className="min-w-0">
                <p className="truncate text-xs text-muted-foreground">
                  {item.label}
                </p>
                <p className="mt-1 text-xl font-semibold tabular-nums tracking-tight">
                  {item.value}
                </p>
              </div>
            </div>
          );
        })}
      </section>

      <TeacherPerformanceTable
        data={data}
        month={month}
        year={year}
      />
    </main>
  );
}