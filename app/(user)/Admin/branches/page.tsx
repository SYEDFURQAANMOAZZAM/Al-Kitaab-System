import { prisma } from "@/lib/prisma";
import AuthVerify from "@/app/ServerActions/auth/authVerify";

import {
  CreateBatch,
  CreateBranch,
} from "@/ServiceHandlers/CreateGroups/CreateBatch&Branch";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import {
  Building2,
  MoreVertical,
  Plus,
} from "lucide-react";

import BatchDetails from "./BatchDetails";

const Page = async () => {
  const timerId = crypto.randomUUID();

  console.time(`branches-total-${timerId}`);

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

  console.timeEnd(`branches-total-${timerId}`);

  return (
    <div className="w-full space-y-6">
      {/* =====================================================
          PAGE HEADER
      ===================================================== */}

      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
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
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-14 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50">
            <Building2 className="h-6 w-6 text-emerald-600" />
          </div>

          <h2 className="mt-4 text-base font-semibold text-slate-900">
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
                className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
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
                      hover:bg-slate-50
                      hover:no-underline
                      sm:px-6
                      sm:py-6
                      sm:pr-16
                    "
                  >
                    <div className="flex min-w-0 w-full items-center gap-4">
                      {/* Branch icon */}

                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-50">
                        <Building2 className="h-5 w-5 text-emerald-600" />
                      </div>

                      {/* Branch info */}

                      <div className="min-w-0 flex-1">
                        <h2 className="truncate text-lg font-semibold text-slate-900 sm:text-xl">
                          {branch.name}
                        </h2>

                        <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground sm:gap-x-4 sm:text-sm">
                          <span>
                            <strong className="text-slate-900">
                              {branch.batches.length}
                            </strong>{" "}
                            {branch.batches.length === 1
                              ? "Batch"
                              : "Batches"}
                          </span>

                          <span className="text-slate-300">
                            •
                          </span>

                          <span>
                            <strong className="text-slate-900">
                              {totalStudents}
                            </strong>{" "}
                            {totalStudents === 1
                              ? "Student"
                              : "Students"}
                          </span>

                          <span className="text-slate-300">
                            •
                          </span>

                          <span>
                            <strong className="text-slate-900">
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

                  <DropdownMenu>
                    <DropdownMenuTrigger
                      className="
                        absolute
                        right-3
                        top-1/2
                        z-10
                        -translate-y-1/2
                        rounded-lg
                        p-2
                        text-muted-foreground
                        transition
                        hover:bg-slate-100
                        hover:text-slate-900
                        sm:right-4
                      "
                      aria-label={`Actions for ${branch.name}`}
                    >
                      <MoreVertical className="h-5 w-5" />
                    </DropdownMenuTrigger>

                    <DropdownMenuContent align="end">
                      <DropdownMenuItem>
                        Rename Branch
                      </DropdownMenuItem>

                      <DropdownMenuSeparator />

                      <DropdownMenuItem variant="destructive">
                        Delete Branch
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                {/* =================================================
                    BRANCH CONTENT
                ================================================= */}

                <AccordionContent className="border-t border-slate-200 bg-slate-50/60">
                  <div className="space-y-4 p-3 sm:p-5">
                    {/* Batches heading */}

                    <div className="flex items-center justify-between px-1">
                      <div>
                        <h3 className="text-sm font-semibold text-slate-900 sm:text-base">
                          Batches
                        </h3>

                        <p className="mt-0.5 text-xs text-muted-foreground">
                          Manage batches and their members.
                        </p>
                      </div>

                      <span className="rounded-full bg-white px-2.5 py-1 text-xs font-medium text-slate-600 ring-1 ring-slate-200">
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
                            className="overflow-hidden rounded-xl border border-slate-200 bg-white"
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
                                  hover:bg-slate-50
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
                                      <span className="block truncate text-sm font-semibold text-slate-900 lg:text-base">
                                        {batch.name}
                                      </span>
                                    </div>

                                    {/* Statistics */}

                                    <div className="mr-4 flex shrink-0 items-center gap-6 text-sm text-muted-foreground lg:mr-6">
                                      <span className="whitespace-nowrap">
                                        (
                                        <strong className="text-slate-900">
                                          {
                                            batch._count
                                              .teachers
                                          }
                                        </strong>
                                        ) Teachers
                                      </span>

                                      <span className="whitespace-nowrap">
                                        (
                                        <strong className="text-slate-900">
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
                                    <span className="block truncate pr-2 text-sm font-semibold text-slate-900">
                                      {batch.name}
                                    </span>

                                    <div className="mt-1.5 flex items-center gap-4 text-xs text-muted-foreground">
                                      <span className="whitespace-nowrap">
                                        (
                                        <strong className="text-slate-900">
                                          {
                                            batch._count
                                              .teachers
                                          }
                                        </strong>
                                        ) TR
                                      </span>

                                      <span className="whitespace-nowrap">
                                        (
                                        <strong className="text-slate-900">
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

                              <DropdownMenu>
                                <DropdownMenuTrigger
                                  className="
                                    absolute
                                    right-3
                                    top-1/2
                                    z-20
                                    -translate-y-1/2
                                    rounded-lg
                                    p-2
                                    text-muted-foreground
                                    transition
                                    hover:bg-slate-100
                                    hover:text-slate-900
                                    sm:right-4
                                  "
                                  aria-label={`Actions for ${batch.name}`}
                                >
                                  <MoreVertical className="h-5 w-5" />
                                </DropdownMenuTrigger>

                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem>
                                    Rename Batch
                                  </DropdownMenuItem>

                                  <DropdownMenuSeparator />

                                  <DropdownMenuItem variant="destructive">
                                    Delete Batch
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>

                            {/* =================================================
                                BATCH DETAILS
                            ================================================= */}

                            <AccordionContent className="border-t border-slate-200 bg-slate-50/50">
                              <div className="p-3 sm:p-4">
                                <BatchDetails
                                  batchId={batch.id}
                                  studentCount={
                                    batch._count.students
                                  }
                                  teacherCount={
                                    batch._count.teachers
                                  }
                                />
                              </div>
                            </AccordionContent>
                          </AccordionItem>
                        ))}
                      </Accordion>
                    ) : (
                      <div className="rounded-xl border border-dashed border-slate-300 bg-white px-5 py-10 text-center">
                        <p className="text-sm font-medium text-slate-700">
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

                    <div className="rounded-xl border border-dashed border-slate-300 bg-white p-3 sm:p-4">
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