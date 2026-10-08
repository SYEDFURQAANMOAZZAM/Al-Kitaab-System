import { Building2 } from "lucide-react";

import type { AdminDashboardBranch } from "@/app/ServerActions/AdminDashboard/types";

import { BatchAttendanceCard } from "./BatchAttendanceCard";

type BranchBatchSectionProps = {
  branch: AdminDashboardBranch;
};

export function BranchBatchSection({
  branch,
}: BranchBatchSectionProps) {
  return (
    <section className="space-y-4">
      {/* Branch heading */}
      <div className="flex items-center gap-3">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
          <Building2 className="size-5" />
        </div>

        <div className="min-w-0">
          <h3 className="truncate text-lg font-semibold tracking-tight">
            {branch.name}
          </h3>

          <p className="text-sm text-muted-foreground">
            {branch.batches.length}{" "}
            {branch.batches.length === 1 ? "batch" : "batches"}
          </p>
        </div>
      </div>

      {/* Batches */}
      {branch.batches.length === 0 ? (
        <div className="rounded-xl border border-dashed bg-muted/20 px-4 py-8 text-center">
          <p className="text-sm font-medium">
            No batches in this branch
          </p>

          <p className="mt-1 text-xs text-muted-foreground">
            Batches assigned to this branch will appear here.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-5">
          {branch.batches.map((batch) => (
            <BatchAttendanceCard
              key={batch.id}
              batch={batch}
              branchId={branch.id}
              batchId={batch.id}
            />
          ))}
        </div>
      )}
    </section>
  );
}
