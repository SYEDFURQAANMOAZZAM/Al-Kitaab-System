
"use client";

import { FileDown, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";

type Props = {
  teacherId: string;
  teacherName: string;
  month: number;
  year: number;
  onDelete?: () => void;
};

export default function TeacherPerformanceHeader({
  teacherId,
  teacherName,
  month,
  year,
  onDelete,
}: Props) {
  function handleExportPdf() {
    const params = new URLSearchParams({
      teacherId,
      month: String(month),
      year: String(year),
    });

    window.location.assign(
      `/api/reports/teacher?${params.toString()}`
    );
  }

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <h1 className="truncate text-xl font-semibold tracking-tight sm:text-2xl">
          {teacherName}
        </h1>

        <p className="mt-1 text-sm text-muted-foreground">
          Teacher performance and attendance
        </p>
      </div>

      <div className="flex shrink-0 items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={handleExportPdf}
        >
          <FileDown className="mr-2 size-4" />
          Export PDF
        </Button>

        <Button
          variant="destructive"
          size="sm"
          onClick={onDelete}
          disabled={!onDelete}
        >
          <Trash2 className="mr-2 size-4" />
          Delete
        </Button>
      </div>
    </div>
  );
}
