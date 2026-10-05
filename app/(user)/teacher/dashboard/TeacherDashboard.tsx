import {
  BookOpen,
  GraduationCap,
  Users,
  UsersRound,
} from "lucide-react";

import type { TeacherDashboardResult } from "@/app/ServerActions/TeacherDashboard/types";

import { DashboardStatCard } from "./DashboardStatCard";
import { DashboardMonthSelector } from "./DashboardMonthSelector";
import { BatchAttendanceCard } from "./BatchAttendanceCard";

type TeacherDashboardProps = {
  dashboard: TeacherDashboardResult;
  month: number;
  year: number;
};

export function TeacherDashboard({
  dashboard,
  month,
  year,
}: TeacherDashboardProps) {
  const {
    teacherName,
    counts,
    batches,
  } = dashboard;

  return (
    <main className="space-y-8 p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <section>
        <p className="text-sm font-medium text-muted-foreground">
          Teacher Dashboard
        </p>

        <h1 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">
          Welcome, {teacherName}
        </h1>

        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          Monitor your assigned batches and monthly
          attendance performance.
        </p>
      </section>

      {/* Stats */}
      <section className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-5">
        <DashboardStatCard
          title="Batches"
          value={counts.batches}
          icon={GraduationCap}
        />

        <DashboardStatCard
          title="Subjects"
          value={counts.subjects}
          icon={BookOpen}
        />

        <DashboardStatCard
          title="Students"
          value={counts.students}
          icon={Users}
        />

        <DashboardStatCard
          title="Teachers"
          value={counts.teachers}
          icon={UsersRound}
        />
      </section>

      {/* Batches */}
      <section className="space-y-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xl font-semibold tracking-tight">
              Assigned Batches
            </h2>

            <p className="mt-1 text-sm text-muted-foreground">
              Monthly attendance performance
            </p>
          </div>

          <DashboardMonthSelector
            month={month}
            year={year}
          />
        </div>

        {batches.length === 0 ? (
          <div className="flex min-h-64 items-center justify-center rounded-xl border border-dashed bg-muted/30">
            <div className="text-center">
              <GraduationCap className="mx-auto size-9 text-muted-foreground" />

              <h3 className="mt-3 font-medium">
                No assigned batches
              </h3>

              <p className="mt-1 text-sm text-muted-foreground">
                You currently have no batches assigned.
              </p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-5">
            {batches.map((batch) => (
              <BatchAttendanceCard
                key={batch.id}
                batch={batch}
              />
            ))}
          </div>
        )}
      </section>
    </main>
  );
}