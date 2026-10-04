"use client";

import {
  Download,
  Trash2,
} from "lucide-react";

import { Button } from "@/components/ui/button";

type Props = {
  studentName: string;
  isAdmin: boolean;
  studentId: string;
  year: number;
  month: number;
};

export default function StudentPerformanceHeader({
  studentName,
  isAdmin,
  studentId,
  year,
  month,
}: Props) {
  return (
    <header className="flex min-w-0 flex-col gap-4 border-b border-border pb-5 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <h1 className="truncate text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          {studentName}
        </h1>

        <p className="mt-1 text-sm text-muted-foreground">
          Student performance
        </p>
      </div>

      <div className="flex shrink-0 items-center gap-2">
        <Button
          type="button"
          variant="outline"
          className="gap-2"
          onClick={() => {
            const params = new URLSearchParams({
              studentId,
              year: String(year),
              month: String(month),
            });

            window.location.href =
              `/api/reports/student?${params.toString()}`;
          }}
        >
          <Download className="size-4" />

          <span className="hidden sm:inline">
            Export PDF
          </span>

          <span className="sm:hidden">
            Export
          </span>
        </Button>

        
      </div>
    </header>
  );
}