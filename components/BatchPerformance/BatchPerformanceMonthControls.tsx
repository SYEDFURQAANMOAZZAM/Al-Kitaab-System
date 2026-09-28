"use client";

import * as React from "react";

import {
  usePathname,
  useRouter,
  useSearchParams,
} from "next/navigation";

import { Input } from "@/components/ui/input";

type Props = {
  year: number;
  month: number;
};

export default function BatchPerformanceMonthControls({
  year,
  month,
}: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const value = `${year}-${String(month).padStart(
    2,
    "0"
  )}`;

  const handleChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const nextValue = event.target.value;

    if (!nextValue) {
      return;
    }

    const [nextYear, nextMonth] =
      nextValue.split("-").map(Number);

    if (
      !nextYear ||
      !nextMonth ||
      nextMonth < 1 ||
      nextMonth > 12
    ) {
      return;
    }

    const params = new URLSearchParams(
      searchParams.toString()
    );

    params.set("year", String(nextYear));
    params.set("month", String(nextMonth));

    router.push(
      `${pathname}?${params.toString()}`
    );
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