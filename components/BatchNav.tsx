"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";

type BatchNavProps = {
  basePath: string;
  className?: string;
};

const tabs = [
  { value: "progress", label: "Progress" },
  { value: "attendance", label: "Attendance" },
  { value: "performance", label: "Performance" },
  { value: "students", label: "Students" },
  { value: "teachers", label: "Teachers" },
] as const;

export function BatchNav({ basePath, className }: BatchNavProps) {
  const pathname = usePathname();

  const activeTab =
    tabs.find((tab) => {
      const path = `${basePath}/${tab.value}`;

      return pathname === path || pathname.startsWith(`${path}/`);
    })?.value ?? "progress";

  return (
    <div className={cn("w-full min-w-0", className)}>
      <div
        role="tablist"
        aria-label="Batch navigation"
        data-horizontal-scroll="true"
        className={cn(
          "flex w-full min-w-0 gap-1 overflow-x-auto rounded-lg bg-muted p-1",
          "[scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        )}
      >
        {tabs.map((tab) => {
          const href = `${basePath}/${tab.value}`;
          const isActive = activeTab === tab.value;

          return (
            <Link
              key={tab.value}
              href={href}
              role="tab"
              aria-selected={isActive}
              aria-current={isActive ? "page" : undefined}
              className={cn(
                "flex min-w-[100px] flex-1 items-center justify-center",
                "whitespace-nowrap rounded-md px-3 py-2 text-sm font-medium",
                "transition-colors",
                "focus-visible:outline-none focus-visible:ring-2",
                "focus-visible:ring-ring focus-visible:ring-offset-2",
                isActive
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:bg-background/60 hover:text-foreground"
              )}
            >
              {tab.label}
            </Link>
          );
        })}
      </div>
    </div>
  );
}