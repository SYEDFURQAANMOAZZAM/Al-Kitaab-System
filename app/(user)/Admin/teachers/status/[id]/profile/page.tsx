import { notFound } from "next/navigation";

import { prisma } from "@/lib/prisma";

type TeacherProfilePageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function TeacherProfilePage({
  params,
}: TeacherProfilePageProps) {
  const { id } = await params;

  const teacher = await prisma.teacher.findUnique({
    where: {
      id,
    },
    select: {
      id: true,

      user: {
        select: {
          name: true,
          email: true,
          phone: true,
          createdAt: true,
        },
      },

      assignments: {
        select: {
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
        orderBy: {
          batch: {
            name: "asc",
          },
        },
      },
    },
  });

  if (!teacher) {
    notFound();
  }

  return (
    <div className="space-y-6">
      {/* Header */}

      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          Teacher Profile
        </h1>

        <p className="mt-1 text-sm text-muted-foreground">
          View teacher information and current
          assignments
        </p>
      </div>

      {/* Profile card */}

      <section className="overflow-hidden rounded-xl border border-border bg-card">
        <div className="border-b border-border px-6 py-5">
          <h2 className="text-lg font-semibold text-card-foreground">
            Personal Information
          </h2>

          <p className="mt-1 text-sm text-muted-foreground">
            Basic information associated with this
            teacher account.
          </p>
        </div>

        <div className="grid gap-x-8 gap-y-6 p-6 sm:grid-cols-2">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Name
            </p>

            <p className="mt-1.5 text-sm font-semibold text-card-foreground">
              {teacher.user.name ?? "Not provided"}
            </p>
          </div>

          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Email
            </p>

            <p className="mt-1.5 text-sm font-medium text-card-foreground">
              {teacher.user.email}
            </p>
          </div>

          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Phone
            </p>

            <p className="mt-1.5 text-sm font-medium text-card-foreground">
              {teacher.user.phone ?? "Not provided"}
            </p>
          </div>

          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Joined
            </p>

            <p className="mt-1.5 text-sm font-medium text-card-foreground">
              {teacher.user.createdAt.toLocaleDateString(
                "en-IN",
                {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                },
              )}
            </p>
          </div>
        </div>
      </section>

      {/* Assignment summary */}

      <section className="overflow-hidden rounded-xl border border-border bg-card">
        <div className="flex items-center justify-between border-b border-border px-6 py-5">
          <div>
            <h2 className="text-lg font-semibold text-card-foreground">
              Current Assignments
            </h2>

            <p className="mt-1 text-sm text-muted-foreground">
              Branches and batches assigned to this
              teacher.
            </p>
          </div>

          <span className="rounded-full bg-accent px-3 py-1 text-xs font-semibold text-accent-foreground">
            {teacher.assignments.length}{" "}
            {teacher.assignments.length === 1
              ? "Batch"
              : "Batches"}
          </span>
        </div>

        {teacher.assignments.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-sm text-muted-foreground">
              No batches assigned to this teacher.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {teacher.assignments.map(
              ({ batch }) => (
                <div
                  key={batch.id}
                  className="flex items-center justify-between gap-4 px-6 py-4"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-card-foreground">
                      {batch.name}
                    </p>

                    <p className="mt-1 text-xs text-muted-foreground">
                      {batch.branch.name}
                    </p>
                  </div>

                  <span className="shrink-0 rounded-full bg-muted px-3 py-1 text-xs font-medium text-muted-foreground">
                    Batch
                  </span>
                </div>
              ),
            )}
          </div>
        )}
      </section>
    </div>
  );
}