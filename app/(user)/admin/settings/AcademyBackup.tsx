"use client";

import { useState } from "react";
import {
  CalendarDays,
  Download,
  Users,
  ClipboardCheck,
  LoaderCircle,
} from "lucide-react";

type Props = {
  batchIds: string[];
  studentIds: string[];
};

type BackupType = "attendance" | "progress";

const currentDate = new Date();

export default function AcademyBackup({
  batchIds,
  studentIds,
}: Props) {
  const [year, setYear] = useState(currentDate.getFullYear());
  const [month, setMonth] = useState(currentDate.getMonth() + 1);
  const [loading, setLoading] = useState<BackupType | null>(null);

  const months = [
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

  async function exportReport(type: BackupType) {
    const ids =
      type === "attendance" ? batchIds : studentIds;

    if (ids.length === 0) {
      alert(
        type === "attendance"
          ? "No batches found."
          : "No students found.",
      );
      return;
    }

    setLoading(type);

    try {
      const response = await fetch(
        type === "attendance"
          ? "/api/reports/academy/attendance"
          : "/api/reports/academy/progress",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(
            type === "attendance"
              ? {
                  batchIds: ids,
                  year,
                  month,
                }
              : {
                  studentIds: ids,
                  year,
                  month,
                },
          ),
        },
      );

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(
          result.error ??
            result.message ??
            "Failed to fetch report data.",
        );
      }

      const pdfResponse = await fetch(
        type === "attendance"
          ? "/api/reports/academy/attendance/pdf"
          : "/api/reports/academy/progress/pdf",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(result),
        },
      );

      if (!pdfResponse.ok) {
        throw new Error("Failed to generate PDF.");
      }

      const blob = await pdfResponse.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");

      link.href = url;
      link.download = `academy-${type}-${year}-${String(month).padStart(2, "0")}.pdf`;

      document.body.appendChild(link);
      link.click();
      link.remove();

      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Backup export error:", error);

      alert(
        error instanceof Error
          ? error.message
          : "Something went wrong.",
      );
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2 rounded-lg border bg-card p-3 sm:flex-row sm:items-center sm:gap-3">
        <CalendarDays className="hidden size-5 shrink-0 text-muted-foreground sm:block" />

        <div className="grid flex-1 grid-cols-2 gap-2">
          <select
            value={month}
            onChange={(e) =>
              setMonth(Number(e.target.value))
            }
            className="h-9 min-w-0 rounded-md border bg-background px-2 text-sm"
            aria-label="Month"
          >
            {months.map((name, index) => (
              <option
                key={name}
                value={index + 1}
              >
                {name}
              </option>
            ))}
          </select>

          <select
            value={year}
            onChange={(e) =>
              setYear(Number(e.target.value))
            }
            className="h-9 min-w-0 rounded-md border bg-background px-2 text-sm"
            aria-label="Year"
          >
            {Array.from(
              {
                length: 10,
              },
              (_, index) =>
                currentDate.getFullYear() - index,
            ).map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>
        </div>
      </div>

      <BackupCard
        title="Attendance Backup"
        description="Export monthly attendance records for all academy batches."
        count={`${batchIds.length} batches`}
        icon={
          <ClipboardCheck className="size-5" />
        }
        loading={loading === "attendance"}
        onExport={() =>
          exportReport("attendance")
        }
      />

      <BackupCard
        title="Student Progress Backup"
        description="Export daily progress records for all academy students."
        count={`${studentIds.length} students`}
        icon={
          <Users className="size-5" />
        }
        loading={loading === "progress"}
        onExport={() =>
          exportReport("progress")
        }
      />
    </div>
  );
}

function BackupCard({
  title,
  description,
  count,
  icon,
  loading,
  onExport,
}: {
  title: string;
  description: string;
  count: string;
  icon: React.ReactNode;
  loading: boolean;
  onExport: () => void;
}) {
  return (
    <section className="rounded-lg border bg-card p-3 sm:p-4">
      <div className="flex min-w-0 items-start gap-3">
        <div className="flex size-9 shrink-0 items-center justify-center rounded-md bg-muted">
          {icon}
        </div>

        <div className="min-w-0 flex-1">
          <h2 className="text-sm font-semibold sm:text-base">
            {title}
          </h2>

          <p className="mt-1 text-xs leading-relaxed text-muted-foreground sm:text-sm">
            {description}
          </p>

          <p className="mt-1 text-xs text-muted-foreground">
            {count}
          </p>
        </div>
      </div>

      <div className="mt-3 flex justify-end">
        <button
          type="button"
          onClick={onExport}
          disabled={loading}
          className="inline-flex h-9 w-full items-center justify-center gap-2 rounded-md bg-primary px-3 text-xs font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 sm:w-auto sm:text-sm"
        >
          {loading ? (
            <LoaderCircle className="size-4 animate-spin" />
          ) : (
            <Download className="size-4" />
          )}

          {loading
            ? "Generating..."
            : "Export PDF"}
        </button>
      </div>
    </section>
  );
}