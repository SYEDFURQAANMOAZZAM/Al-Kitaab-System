import { prisma } from "@/lib/prisma";
import AuthVerify from "@/app/ServerActions/auth/authVerify";

import {
  CreateBatch,
  CreateBranch,
} from "./CreateBatch&Branch";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

import BranchAction from "./BranchAction";

import BatchAction from "./BatchAction"

import Link from "next/link";

import {
  Building2,
  
} from "lucide-react";



const Page = async () => {

 

  await AuthVerify("ADMIN");

  const branches = await prisma.branch.findMany({
    select: {
      id: true,
      name: true,

      batches: {
        select: {
          id: true,
          name: true,

          _count: {
            select: {
              students: true,
              teachers: true,
            },
          },
        },
      },
    },
  });

 

  return (
    <div className="w-full space-y-6">
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

      <CreateBranch />

      {/* =====================================================
          EMPTY STATE
      ===================================================== */}

      {branches.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-card px-6 py-14 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-accent">
            <Building2 className="h-6 w-6 text-primary" />
          </div>

          <h2 className="mt-4 text-base font-semibold text-card-foreground">
            No branches yet
          </h2>

          <p className="mt-1 text-sm text-muted-foreground">
            Create your first branch to start managing batches.
          </p>
        </div>
      ) : (
        /* =====================================================
           BRANCH ACCORDION
        ===================================================== */

        <Accordion
          multiple
          className="w-full space-y-4"
        >
          {branches.map((branch) => {
            const totalStudents =
              branch.batches.reduce(
                (total, batch) =>
                  total + batch._count.students,
                0
              );

            const totalTeachers =
              branch.batches.reduce(
                (total, batch) =>
                  total + batch._count.teachers,
                0
              );

            return (
              <AccordionItem
                key={branch.id}
                value={branch.id}
                className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm"
              >
                {/* =================================================
                    BRANCH HEADER
                ================================================= */}

                <div className="relative">
                  {/*
                    Keep menu OUTSIDE AccordionTrigger.
                    This prevents nested buttons.
                  */}

                  <AccordionTrigger
                    className="
                      w-full
                      px-4
                      py-5
                      pr-14
                      text-left
                      hover:bg-accent
                      hover:no-underline
                      sm:px-6
                      sm:py-6
                      sm:pr-16
                    "
                  >
                    <div className="flex min-w-0 w-full items-center gap-4">
                      {/* Branch icon */}

                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-accent">
                        <Building2 className="h-5 w-5 text-primary" />
                      </div>

                      {/* Branch info */}

                      <div className="min-w-0 flex-1">
                        <h2 className="truncate text-lg font-semibold text-card-foreground sm:text-xl">
                          {branch.name}
                        </h2>

                        <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground sm:gap-x-4 sm:text-sm">
                          <span>
                            <strong className="text-card-foreground">
                              {branch.batches.length}
                            </strong>{" "}
                            {branch.batches.length === 1
                              ? "Batch"
                              : "Batches"}
                          </span>

                          <span className="text-muted-foreground/60">
                            •
                          </span>

                          <span>
                            <strong className="text-card-foreground">
                              {totalStudents}
                            </strong>{" "}
                            {totalStudents === 1
                              ? "Student"
                              : "Students"}
                          </span>

                          <span className="text-muted-foreground/60">
                            •
                          </span>

                          <span>
                            <strong className="text-card-foreground">
                              {totalTeachers}
                            </strong>{" "}
                            {totalTeachers === 1
                              ? "Teacher"
                              : "Teachers"}
                          </span>
                        </div>
                      </div>
                    </div>
                  </AccordionTrigger>

                  {/* =================================================
                      BRANCH ACTIONS
                  ================================================= */}

                  <BranchAction branchName={branch.name} branchId={branch.id} branchBatches={branch.batches.length} />
                </div>

                {/* =================================================
                    BRANCH CONTENT
                ================================================= */}

                <AccordionContent className="border-t border-border bg-muted/60">
                  <div className="space-y-4 p-3 sm:p-5">
                    {/* Batches heading */}

                    <div className="flex items-center justify-between px-1">
                      <div>
                        <h3 className="text-sm font-semibold text-foreground sm:text-base">
                          Batches
                        </h3>

                        <p className="mt-0.5 text-xs text-muted-foreground">
                          Manage batches and their members.
                        </p>
                      </div>

                      <span className="rounded-full bg-card px-2.5 py-1 text-xs font-medium text-muted-foreground ring-1 ring-border">
                        {branch.batches.length}
                      </span>
                    </div>

                    {/* =================================================
                        BATCHES
                    ================================================= */}

                    {branch.batches.length > 0 ? (
                      <Accordion
                        multiple
                        className="w-full space-y-2.5"
                      >
                        {branch.batches.map((batch) => (
                          <AccordionItem
                            key={batch.id}
                            value={batch.id}
                            className="overflow-hidden rounded-xl border border-border bg-card"
                          >
                            {/* =================================================
                                BATCH HEADER
                            ================================================= */}

                            <div className="relative">
                              {/*
                                IMPORTANT:
                                AccordionTrigger contains ONLY the
                                clickable batch area.
                                Three-dot menu is outside it.
                              */}

                              <AccordionTrigger
                                className="
                                  w-full
                                  px-4
                                  py-3.5
                                  pr-14
                                  text-left
                                  hover:bg-accent
                                  hover:no-underline
                                  sm:px-5
                                  sm:py-4
                                  sm:pr-16
                                "
                              >
                                <div className="w-full min-w-0">
                                  {/* =====================================
                                      MD+
                                  ====================================== */}

                                  <div className="hidden min-w-0 items-center md:flex">
                                    {/* Batch name */}

                                    <div className="min-w-0 flex-1">
                                      <span className="block truncate text-sm font-semibold text-card-foreground lg:text-base">
                                        {batch.name}
                                      </span>
                                    </div>

                                    {/* Statistics */}

                                    <div className="mr-4 flex shrink-0 items-center gap-6 text-sm text-muted-foreground lg:mr-6">
                                      <span className="whitespace-nowrap">
                                        (
                                        <strong className="text-card-foreground">
                                          {
                                            batch._count
                                              .teachers
                                          }
                                        </strong>
                                        ) Teachers
                                      </span>

                                      <span className="whitespace-nowrap">
                                        (
                                        <strong className="text-card-foreground">
                                          {
                                            batch._count
                                              .students
                                          }
                                        </strong>
                                        ) Students
                                      </span>
                                    </div>
                                  </div>

                                  {/* =====================================
                                      XS - SMALL
                                  ====================================== */}

                                  <div className="block min-w-0 md:hidden">
                                    <span className="block truncate pr-2 text-sm font-semibold text-card-foreground">
                                      {batch.name}
                                    </span>

                                    <div className="mt-1.5 flex items-center gap-4 text-xs text-muted-foreground">
                                      <span className="whitespace-nowrap">
                                        (
                                        <strong className="text-card-foreground">
                                          {
                                            batch._count
                                              .teachers
                                          }
                                        </strong>
                                        ) TR
                                      </span>

                                      <span className="whitespace-nowrap">
                                        (
                                        <strong className="text-card-foreground">
                                          {
                                            batch._count
                                              .students
                                          }
                                        </strong>
                                        ) STDs
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              </AccordionTrigger>

                              {/* =================================================
                                  BATCH ACTIONS
                              ================================================= */}

                              <BatchAction batchId={batch.id} batchName={batch.name} batchStudents={batch._count.students} batchTeachers={batch._count.teachers}/>
                            </div>

                            {/* =================================================
                                BATCH DETAILS
                            ================================================= */}

                            <AccordionContent className="border-t border-border bg-muted/50">
                              <div className="flex flex-col divide-y divide-border">
                                <div className="flex items-center justify-between px-4 py-3">
                                  <span className="text-sm font-medium">Performance</span>

                                  <Link
                                    href={`/Admin/branches/${batch.id}/performance`}
                                    className="inline-flex items-center justify-center rounded-md border border-primary/50 bg-primary/10 px-3 py-1.5 text-sm font-medium text-primary !no-underline transition-colors hover:bg-primary/20"
                                  >
                                    View
                                  </Link>
                                </div>

                                <div className="flex items-center justify-between px-4 py-3">
                                  <span className="text-sm font-medium">Mark Attendance</span>

                                    <Link
                                      href={`/Admin/branches/${batch.id}/attendance`}
                                      className="inline-flex items-center justify-center rounded-md border border-primary/50 bg-primary/10 px-3 py-1.5 text-sm font-medium text-primary !no-underline transition-colors hover:bg-primary/20"
                                    >
                                      Mark
                                    </Link>
                                </div>
                              </div>
                            </AccordionContent>
                          </AccordionItem>
                        ))}
                      </Accordion>
                    ) : (
                      <div className="rounded-xl border border-dashed border-border bg-card px-5 py-10 text-center">
                        <p className="text-sm font-medium text-foreground">
                          No batches yet
                        </p>

                        <p className="mt-1 text-xs text-muted-foreground">
                          Create a batch for this branch.
                        </p>
                      </div>
                    )}

                    {/* =================================================
                        CREATE BATCH
                    ================================================= */}

                    <div className="rounded-xl border border-dashed border-border bg-card p-3 sm:p-4">
                      <CreateBatch
                        branchId={branch.id}
                      />
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>
            );
          })}
        </Accordion>
      )}
    </div>
  );
};

export default Page;