"use client";

import { CalendarDays } from "lucide-react";

import { Label } from "@/components/ui/label";

type Props = {
  month: number;
  year: number;
  onMonthChange: (month: number) => void;
  onYearChange: (year: number) => void;
};

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

export default function TeacherPerformanceMonthYear({
  month,
  year,
  onMonthChange,
  onYearChange,
}: Props) {
  const currentYear = Number(
    new Intl.DateTimeFormat("en-US", {
      timeZone: "Asia/Kolkata",
      year: "numeric",
    }).format(new Date())
  );

  const years = Array.from(
    { length: 10 },
    (_, index) => currentYear - 9 + index
  );

  return (
    <div className="flex w-full flex-col gap-4 rounded-xl border border-border bg-card px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5 md:px-4 lg:px-5">
      {/* Heading */}
      <div className="min-w-0 space-y-1">
        <h2 className="text-sm font-semibold tracking-tight text-foreground md:text-base">
          Performance Overview
        </h2>
        <p className="text-xs text-muted-foreground md:text-sm">
          Review monthly teacher attendance
        </p>
      </div>

      {/* Month and Year */}
      <div className="flex flex-wrap items-end gap-3 sm:shrink-0 sm:gap-2 md:gap-3">
        <div className="flex h-9 items-center gap-2 pb-1 text-muted-foreground">
          <CalendarDays className="size-4 shrink-0" />
          <span className="text-sm font-medium">Period</span>
        </div>

        <div className="grid grid-cols-2 gap-2 md:gap-3">
          {/* Month */}
          <div className="space-y-1.5">
            <Label
              htmlFor="teacher-month"
              className="block text-left text-xs font-medium text-muted-foreground"
            >
              Month
            </Label>

            <select
              id="teacher-month"
              value={month}
              onChange={(e) => onMonthChange(Number(e.target.value))}
              className="h-9 w-full min-w-0 rounded-md border border-input bg-background px-3 text-sm text-foreground shadow-sm outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring md:min-w-32"
            >
              {MONTHS.map((name, index) => (
                <option key={name} value={index + 1}>
                  {name}
                </option>
              ))}
            </select>
          </div>

          {/* Year */}
          <div className="space-y-1.5">
            <Label
              htmlFor="teacher-year"
              className="block text-left text-xs font-medium text-muted-foreground"
            >
              Year
            </Label>

            <select
              id="teacher-year"
              value={year}
              onChange={(e) => onYearChange(Number(e.target.value))}
              className="h-9 w-full min-w-0 rounded-md border border-input bg-background px-3 text-sm text-foreground shadow-sm outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring md:min-w-24"
            >
              {years.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>
    </div>
  );
}