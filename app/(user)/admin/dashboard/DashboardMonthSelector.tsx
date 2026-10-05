"use client";

import { useTransition } from "react";
import { usePathname, useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { Button } from "@/components/ui/button";

type DashboardMonthSelectorProps = {
  month: number;
  year: number;
};

const monthFormatter = new Intl.DateTimeFormat("en-US", {
  month: "long",
});

function getMonthName(month: number) {
  return monthFormatter.format(
    new Date(2000, month - 1, 1),
  );
}

export function DashboardMonthSelector({
  month,
  year,
}: DashboardMonthSelectorProps) {
  const router = useRouter();
  const pathname = usePathname();

  const [isPending, startTransition] = useTransition();

  function changeMonth(direction: number) {
    let nextMonth = month + direction;
    let nextYear = year;

    if (nextMonth < 1) {
      nextMonth = 12;
      nextYear -= 1;
    }

    if (nextMonth > 12) {
      nextMonth = 1;
      nextYear += 1;
    }

    const params = new URLSearchParams();

    params.set("month", String(nextMonth));
    params.set("year", String(nextYear));

    startTransition(() => {
      router.push(
        `${pathname}?${params.toString()}`,
      );
    });
  }

  return (
    <div className="flex items-center rounded-lg border bg-background p-1 shadow-sm">
      <Button
        variant="ghost"
        size="icon"
        className="size-8"
        disabled={isPending}
        onClick={() => changeMonth(-1)}
        aria-label="Previous month"
      >
        <ChevronLeft className="size-4" />
      </Button>

      <div className="min-w-[120px] px-2 text-center">
        <p className="text-sm font-medium">
          {getMonthName(month)}
        </p>

        <p className="text-xs text-muted-foreground">
          {year}
        </p>
      </div>

      <Button
        variant="ghost"
        size="icon"
        className="size-8"
        disabled={isPending}
        onClick={() => changeMonth(1)}
        aria-label="Next month"
      >
        <ChevronRight className="size-4" />
      </Button>
    </div>
  );
}