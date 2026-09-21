import CreateBatch from "./CreateBatch";
import CreateBranch from "./CreateBranch";
import BranchAction from "./BranchAction";
import BatchAction from "./BatchAction";
import { requireRole } from "@/lib/auth/require-role";
import Link from "next/link";
import { Building2 } from "lucide-react";

import getBranchesAndBatches from "@/app/ServerActions/getGroups/getBranchesAndBatches";

const Page = async () => {
  const user=await requireRole("ADMIN","TEACHER");
  const isAdmin = user.role === "ADMIN";
  const branches = await getBranchesAndBatches();

  return (
    <div className="w-full space-y-5 sm:px-1 md:px-3 lg:px-4">
      {/* =====================================================
          PAGE HEADER
      ===================================================== */}

      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          Branches & Batches
        </h1>

        <p className="mt-1 text-sm text-muted-foreground">
          Manage branches, batches, teachers, and students.
        </p>
      </div>

      {/* =====================================================
          CREATE BRANCH
      ===================================================== */}

      {isAdmin&&<CreateBranch />}

      {/* =====================================================
          EMPTY STATE
      ===================================================== */}

      {branches.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border px-6 py-14 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-accent">
            <Building2 className="h-6 w-6 text-primary" />
          </div>

          <h2 className="mt-4 text-base font-semibold text-foreground">
            No branches yet
          </h2>

          <p className="mt-1 text-sm text-muted-foreground">
            Create your first branch to start managing batches.
          </p>
        </div>
      ) : (
        /* =====================================================
           BRANCHES
        ===================================================== */

        <div className="space-y-4">
          {branches.map((branch) => {
            const totalStudents = branch.batches.reduce(
              (total, batch) => total + batch._count.students,
              0
            );

            const totalTeachers = branch.batches.reduce(
              (total, batch) => total + batch._count.teachers,
              0
            );

            return (
              <section
                key={branch.id}
                className="
                  overflow-hidden
                  rounded-xl
                  bg-muted/40
                  ring-1
                  ring-border/70
                "
              >
                {/* =================================================
                    BRANCH HEADER
                ================================================= */}

                <div
                  className="
                    flex
                    min-w-0
                    items-center
                    gap-3
                    bg-accent/40
                    px-3
                    py-3
                    sm:gap-4
                    sm:px-4
                    sm:py-4
                  "
                >
                  {/* Branch icon */}

                  <div
                    className="
                      flex
                      h-9
                      w-9
                      shrink-0
                      items-center
                      justify-center
                      rounded-lg
                      bg-accent
                      text-primary
                      sm:h-10
                      sm:w-10
                    "
                  >
                    <Building2 className="h-4 w-4 sm:h-5 sm:w-5" />
                  </div>

                  {/* Branch information */}

                  <div className="min-w-0 flex-1">
                    <h2
                      className="
                        truncate
                        text-sm
                        font-semibold
                        text-foreground
                        sm:text-base
                      "
                    >
                      {branch.name}
                    </h2>

                    <div
                      className="
                        mt-1
                        flex
                        items-center
                        gap-1.5
                        whitespace-nowrap
                        text-[10px]
                        text-muted-foreground
                        sm:gap-2
                        sm:text-xs
                      "
                    >
                      <span>
                        {branch.batches.length}{" "}
                        {branch.batches.length === 1
                          ? "Batch"
                          : "Batches"}
                      </span>

                      <span>•</span>

                      <span>
                        {totalStudents} Students
                      </span>

                      <span>•</span>

                      <span>
                        {totalTeachers} Teachers
                      </span>
                    </div>
                  </div>

                  {/* Branch Action */}

                  <div className="relative h-9 w-9 shrink-0">
                    {isAdmin&&<BranchAction
                      branchName={branch.name}
                      branchId={branch.id}
                      branchBatches={branch.batches.length}
                    />}
                  </div>
                </div>

                {/* =================================================
                    BATCH AREA

                    Slightly inset from branch header so it is
                    visually clear that these belong to branch.
                ================================================= */}

                <div className="px-2 pb-2 pt-1 sm:px-3 sm:pb-3">
                  {branch.batches.length > 0 ? (
                    <div
                      className="
                        rounded-lg
                        bg-background/70
                        px-2
                        sm:px-3
                      "
                    >
                      {branch.batches.map((batch, index) => (
                        <div
                          key={batch.id}
                          className={`
                            py-3
                            ${index !== 0 ? "border-t border-border/50" : ""}
                          `}
                        >
                          {/* Batch name + BatchAction */}
                          <div className="flex w-full items-start">
                            <div className="min-w-0 flex-1">
                              <div className="truncate text-xs font-medium text-foreground sm:text-sm">
                                {batch.name}
                              </div>

                              <div className="mt-1 flex items-center gap-2 text-[10px] text-muted-foreground sm:text-xs">
                                <span>{batch._count.teachers} Teachers</span>

                                <span>•</span>

                                <span>{batch._count.students} Students</span>
                              </div>
                            </div>

                            {/* ONLY BatchAction — far right */}
                            <div className="relative h-8 w-8 shrink-0">
                              {isAdmin&&<BatchAction
                                batchId={batch.id}
                                batchName={batch.name}
                                batchStudents={batch._count.students}
                                batchTeachers={batch._count.teachers}
                              />}
                            </div>
                          </div>

                          {/* Buttons — next line */}
                          <div className="mt-2 flex items-center gap-2">
                            <Link
                              href={`/admin/branches/${batch.id}/attendance`}
                              className="
                                inline-flex
                                h-8
                                items-center
                                justify-center
                                rounded-md
                                bg-primary
                                px-3
                                text-[10px]
                                font-medium
                                text-primary-foreground
                                shadow-sm
                                transition-colors
                                hover:bg-primary/90
                                focus-visible:outline-none
                                focus-visible:ring-2
                                focus-visible:ring-ring
                              "
                            >
                              Mark Attendance
                            </Link>

                            <Link
                              href={`/admin/branches/${batch.id}/performance`}
                              className="
                                inline-flex
                                h-8
                                items-center
                                justify-center
                                rounded-md
                                border
                                border-border
                                bg-secondary
                                px-3
                                text-[10px]
                                font-medium
                                text-secondary-foreground
                                shadow-sm
                                transition-colors
                                hover:bg-secondary/80
                                focus-visible:outline-none
                                focus-visible:ring-2
                                focus-visible:ring-ring
                              "
                            >
                              View Performance
                            </Link>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div
                      className="
                        rounded-lg
                        bg-background/50
                        px-3
                        py-4
                        text-xs
                        text-muted-foreground
                      "
                    >
                      No batches yet.
                    </div>
                  )}

                  {/* =================================================
                      CREATE BATCH
                  ================================================= */}

                  <div className="px-1 pt-2">
                    {isAdmin&&<CreateBatch branchId={branch.id} />}
                  </div>
                </div>
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Page;