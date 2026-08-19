import { notFound } from "next/navigation";

import { prisma } from "@/lib/prisma";

type StudentProfilePageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function StudentProfilePage({
  params,
}: StudentProfilePageProps) {
  const { id } = await params;

  const student = await prisma.student.findUnique({
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

      enrollments: {
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

  if (!student) {
    notFound();
  }

  return (
    <div className="space-y-6">
      {/* Header */}

      <div>
        <h1 className="text-3xl font-bold tracking-tight text-emerald-900">
          Student Profile
        </h1>

        <p className="mt-1 text-sm text-slate-600">
          View student information and current
          assignments
        </p>
      </div>

      {/* Personal Information */}

      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <div className="border-b border-slate-200 px-6 py-5">
          <h2 className="text-lg font-semibold text-slate-900">
            Personal Information
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Basic information associated with this
            student account.
          </p>
        </div>

        <div className="grid gap-x-8 gap-y-6 p-6 sm:grid-cols-2">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
              Name
            </p>

            <p className="mt-1.5 text-sm font-semibold text-slate-900">
              {student.user.name ?? "Not provided"}
            </p>
          </div>

          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
              Email
            </p>

            <p className="mt-1.5 text-sm font-medium text-slate-900">
              {student.user.email}
            </p>
          </div>

          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
              Phone
            </p>

            <p className="mt-1.5 text-sm font-medium text-slate-900">
              {student.user.phone ?? "Not provided"}
            </p>
          </div>

          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
              Joined
            </p>

            <p className="mt-1.5 text-sm font-medium text-slate-900">
              {student.user.createdAt.toLocaleDateString(
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

      {/* Current Batches */}

      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">
              Current Batches
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Batches currently assigned to this
              student.
            </p>
          </div>

          <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
            {student.enrollments.length}{" "}
            {student.enrollments.length === 1
              ? "Batch"
              : "Batches"}
          </span>
        </div>

        {student.enrollments.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-sm text-slate-500">
              No batches assigned to this student.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-200">
            {student.enrollments.map(
              ({ batch }) => (
                <div
                  key={batch.id}
                  className="flex items-center justify-between gap-4 px-6 py-4"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-slate-900">
                      {batch.name}
                    </p>

                    <p className="mt-1 text-xs text-slate-500">
                      {batch.branch.name}
                    </p>
                  </div>

                  <span className="shrink-0 rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
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