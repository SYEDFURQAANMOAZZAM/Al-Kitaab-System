"use client";

import {
  Download,
  Trash2,
} from "lucide-react";

import { Button } from "@/components/ui/button";

type Props = {
  batchName: string;
  batchId: string;
  year: number;
  month: number;
};

export default function BatchPerformanceHeader({
  batchName,
  batchId,
  year,
  month,
}: Props) {
  const handleExportPdf = () => {
    const params = new URLSearchParams({
      batchId,
      year: String(year),
      month: String(month),
    });

    window.open(
      `/api/reports/batch?${params.toString()}`,
      "_blank",
      "noopener,noreferrer"
    );
  };

  return (
    <header className="flex min-w-0 flex-col gap-4 border-b border-border pb-5 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <h1 className="truncate text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          {batchName}
        </h1>

        <p className="mt-1 text-sm text-muted-foreground">
          Batch performance
        </p>
      </div>

      <div className="flex shrink-0 items-center gap-2">
        <Button
          type="button"
          variant="outline"
          className="gap-2"
          onClick={handleExportPdf}
        >
          <Download className="size-4" />

          <span className="hidden sm:inline">
            Export PDF
          </span>

          <span className="sm:hidden">
            Export
          </span>
        </Button>

        <Button
          type="button"
          variant="destructive"
          className="gap-2"
        >
          <Trash2 className="size-4" />

          <span className="hidden sm:inline">
            Delete Data
          </span>

          <span className="sm:hidden">
            Delete
          </span>
        </Button>
      </div>
    </header>
  );
}