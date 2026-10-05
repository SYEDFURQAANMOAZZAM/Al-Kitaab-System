import {
  BookOpen,
  Building2,
  GraduationCap,
  ShieldCheck,
  Users,
  UsersRound,
} from "lucide-react";

import type { AdminDashboardResult } from "@/app/ServerActions/AdminDashboard/types";

import { DashboardStatCard } from "./DashboardStatCard";
import { DashboardMonthSelector } from "./DashboardMonthSelector";
import { BranchBatchSection } from "./BranchBatchSection";

type AdminDashboardProps = {
  dashboard: AdminDashboardResult;
  adminName: string;
  month: number;
  year: number;
};

export function AdminDashboard({
  dashboard,
  adminName,
  month,
  year,
}: AdminDashboardProps) {
  const { counts, branches } = dashboard;

  return (
    <main className="space-y-8 p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <section>
        <p className="text-sm font-medium text-muted-foreground">
          Admin Dashboard
        </p>

        <h1 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">
          Welcome, {adminName}
        </h1>

        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          Monitor your academy, branches, batches, and monthly attendance
          performance.
        </p>
      </section>

      {/* Statistics */}
      <section className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6 md:gap-5">
        <DashboardStatCard
          title="Admins"
          value={counts.admins}
          icon={ShieldCheck}
        />

        <DashboardStatCard
          title="Teachers"
          value={counts.teachers}
          icon={UsersRound}
        />

        <DashboardStatCard
          title="Students"
          value={counts.students}
          icon={Users}
        />

        <DashboardStatCard
          title="Branches"
          value={counts.branches}
          icon={Building2}
        />

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
      </section>

      {/* Branches + Batches */}
      <section className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xl font-semibold tracking-tight">
              Branches & Batches
            </h2>

            <p className="mt-1 text-sm text-muted-foreground">
              Monthly attendance performance by branch and batch
            </p>
          </div>

          <DashboardMonthSelector
            month={month}
            year={year}
          />
        </div>

        {branches.length === 0 ? (
          <div className="flex min-h-64 items-center justify-center rounded-xl border border-dashed bg-muted/30">
            <div className="text-center">
              <Building2 className="mx-auto size-9 text-muted-foreground" />

              <h3 className="mt-3 font-medium">
                No branches found
              </h3>

              <p className="mt-1 text-sm text-muted-foreground">
                There are currently no branches configured.
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-8">
            {branches.map((branch) => (
              <BranchBatchSection
                key={branch.id}
                branch={branch}
              />
            ))}
          </div>
        )}
      </section>
    </main>
  );
}

