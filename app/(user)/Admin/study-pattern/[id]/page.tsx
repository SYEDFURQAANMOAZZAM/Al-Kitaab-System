import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  Check,
  Layers3,
  Pencil,
} from "lucide-react";

import { prisma } from "@/lib/prisma";

type PageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function PatternViewPage({
  params,
}: PageProps) {
  const { id } = await params;

  const pattern = await prisma.pattern.findUnique({
    where: {
      id,
    },

    select: {
      id: true,
      name: true,

      patternArr: {
        select: {
          id: true,
          name: true,
          position: true,
        },

        orderBy: {
          position: "asc",
        },
      },

      batches: {
        select: {
          id: true,

          batch: {
            select: {
              id: true,
              name: true,

              branch: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
        },
      },
    },
  });

  if (!pattern) {
    notFound();
  }

  const batchesByBranch = pattern.batches.reduce(
    (groups, item) => {
      const branchName = item.batch.branch.name;

      if (!groups[branchName]) {
        groups[branchName] = [];
      }

      groups[branchName].push(item.batch);

      return groups;
    },
    {} as Record<
      string,
      typeof pattern.batches[number]["batch"][]
    >
  );

  return (
    <main className="w-full space-y-7 p-4 sm:p-6 lg:p-8">
      {/* =====================================================
          HEADER
      ===================================================== */}

      <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <Link
            href="/Admin/study-pattern"
            className="mb-5 inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Study Patterns
          </Link>

          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10">
              <Layers3 className="h-6 w-6 text-primary" />
            </div>

            <div className="min-w-0">
              <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                {pattern.name}
              </h1>

              <p className="mt-1 text-sm text-muted-foreground">
                Study pattern details and assigned batches
              </p>
            </div>
          </div>
        </div>

        <Link
          href={`/Admin/study-pattern/${pattern.id}/edit`}
          className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border bg-card px-4 text-sm font-medium text-foreground shadow-sm transition-colors hover:bg-muted"
        >
          <Pencil className="h-4 w-4" />
          Edit Pattern
        </Link>
      </div>

      {/* =====================================================
          STAT CARDS
      ===================================================== */}

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl border bg-card p-5 shadow-sm">
          <p className="text-sm text-muted-foreground">
            Pattern Parts
          </p>

          <p className="mt-2 text-3xl font-bold text-foreground">
            {pattern.patternArr.length}
          </p>

          <p className="mt-1 text-xs text-muted-foreground">
            Steps in this study pattern
          </p>
        </div>

        <div className="rounded-xl border bg-card p-5 shadow-sm">
          <p className="text-sm text-muted-foreground">
            Assigned Batches
          </p>

          <p className="mt-2 text-3xl font-bold text-foreground">
            {pattern.batches.length}
          </p>

          <p className="mt-1 text-xs text-muted-foreground">
            Batches currently using this pattern
          </p>
        </div>
      </div>

      {/* =====================================================
          PATTERN STRUCTURE
      ===================================================== */}

      <section className="overflow-hidden rounded-xl border bg-card shadow-sm">
        <div className="border-b px-5 py-5 sm:px-6">
          <h2 className="font-semibold text-foreground">
            Pattern Structure
          </h2>

          <p className="mt-1 text-sm text-muted-foreground">
            The parts below are followed in this order.
          </p>
        </div>

        <div className="p-5 sm:p-6">
          <div className="space-y-3">
            {pattern.patternArr.map((part, index) => {
              const isLast =
                index === pattern.patternArr.length - 1;

              return (
                <div
                  key={part.id}
                  className="flex items-stretch gap-3"
                >
                  {/* Step */}

                  <div className="flex w-8 shrink-0 flex-col items-center">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                      {index + 1}
                    </div>

                    {!isLast && (
                      <div className="mt-2 h-full w-px bg-border" />
                    )}
                  </div>

                  {/* Part */}

                  <div className="flex min-h-[68px] flex-1 flex-col justify-center rounded-lg border bg-background px-4 py-3">
                    <p className="font-medium text-foreground">
                      {part.name}
                    </p>

                    <p className="mt-1 text-xs text-muted-foreground">
                      Step {index + 1}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* =====================================================
          ASSIGNED BATCHES
      ===================================================== */}

      <section className="overflow-hidden rounded-xl border bg-card shadow-sm">
        <div className="border-b px-5 py-5 sm:px-6">
          <h2 className="font-semibold text-foreground">
            Assigned Batches
          </h2>

          <p className="mt-1 text-sm text-muted-foreground">
            These batches currently use this study pattern.
          </p>
        </div>

        {pattern.batches.length === 0 ? (
          <div className="px-6 py-14 text-center">
            <p className="font-medium text-foreground">
              No batches assigned
            </p>

            <p className="mt-1 text-sm text-muted-foreground">
              Edit this pattern to assign it to batches.
            </p>
          </div>
        ) : (
          <div className="space-y-7 p-5 sm:p-6">
            {Object.entries(batchesByBranch).map(
              ([branchName, batches]) => (
                <div key={branchName}>
                  {/* Branch */}

                  <div className="mb-3 flex items-center gap-2">
                    <h3 className="font-medium text-foreground">
                      {branchName}
                    </h3>

                    <span className="rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground">
                      {batches.length}{" "}
                      {batches.length === 1
                        ? "batch"
                        : "batches"}
                    </span>
                  </div>

                  {/* Batches */}

                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {batches.map((batch) => (
                      <div
                        key={batch.id}
                        className="flex items-center gap-3 rounded-lg border bg-background p-4 transition-colors hover:bg-muted/50"
                      >
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                          <Check className="h-4 w-4 text-primary" />
                        </div>

                        <div className="min-w-0">
                          <p className="truncate font-medium text-foreground">
                            {batch.name}
                          </p>

                          <p className="mt-0.5 truncate text-xs text-muted-foreground">
                            {branchName}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )
            )}
          </div>
        )}
      </section>
    </main>
  );
}