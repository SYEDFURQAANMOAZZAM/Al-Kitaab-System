"use client";

import * as React from "react";

import { useSearchParams } from "next/navigation";

import { Input } from "@/components/ui/input";

type Props = {
  year: number;
  month: number;
};

export default function StudentPerformanceMonthControls({
  year,
  month,
}: Props) {
  const searchParams = useSearchParams();

  const value = `${year}-${String(month).padStart(2, "0")}`;

  const handleChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const value = event.target.value;

    if (!value) return;

    const [nextYear, nextMonth] = value.split("-").map(Number);

    if (
      !nextYear ||
      !nextMonth ||
      nextMonth < 1 ||
      nextMonth > 12
    ) {
      return;
    }

    // No reload if the selected month and year are unchanged
    if (nextYear === year && nextMonth === month) {
      return;
    }

    const params = new URLSearchParams(searchParams.toString());

    params.set("year", String(nextYear));
    params.set("month", String(nextMonth));

    // Full browser page reload
    window.location.href = `${window.location.pathname}?${params.toString()}`;
  };

  return (
    <div className="w-full sm:w-auto">
      <Input
        type="month"
        value={value}
        onChange={handleChange}
        className="w-full sm:w-[170px]"
      />
    </div>
  );
}