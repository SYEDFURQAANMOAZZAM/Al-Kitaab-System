import { notFound } from "next/navigation";

import { prisma } from "@/lib/prisma";

type TeacherPerformancePageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function TeacherPerformancePage({
  params,
}: TeacherPerformancePageProps) {
  const { id } = await params;

  const teacher = await prisma.teacher.findUnique({
    where: {
      id,
    },
    select: {
      id: true,
      userId: true,

      user: {
        select: {
          name: true,
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

  const attendance =
    await prisma.attendance.findMany({
      where: {
        userId: teacher.userId,
      },
      select: {
        id: true,
        attended: true,
        remarks: true,
        date: true,
        batchname: true,
      },
      orderBy: {
        date: "desc",
      },
    });

  const totalRecords = attendance.length;

  const presentCount = attendance.filter(
    (record) => record.attended === "PRESENT",
  ).length;

  const absentCount = attendance.filter(
    (record) => record.attended === "ABSENT",
  ).length;

  const attendancePercentage =
    totalRecords === 0
      ? 0
      : Math.round(
          (presentCount / totalRecords) * 100,
        );

  return (
    <div className="space-y-6">
      {/* Header */}

      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          Teacher Performance
        </h1>

        <p className="mt-1 text-sm text-muted-foreground">
          Attendance and assignment overview for{" "}
          <span className="font-semibold text-foreground">
            {teacher.user.name ?? "Unnamed"}
          </span>
        </p>
      </div>

      {/* Attendance summary */}

      <div className="grid gap-4 sm:grid-cols-3">
        {/* Attendance */}

        <div className="rounded-xl border border-border bg-card p-5">
          <p className="text-sm font-medium text-muted-foreground">
            Attendance
          </p>

          <div className="mt-3 flex items-end justify-between">
            <p className="text-3xl font-bold text-card-foreground">
              {attendancePercentage}%
            </p>

            <span className="text-xs font-medium text-muted-foreground">
              Overall
            </span>
          </div>

          <div className="mt-4 h-2 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-primary"
              style={{
                width: `${attendancePercentage}%`,
              }}
            />
          </div>
        </div>

        {/* Present */}

        <div className="rounded-xl border border-border bg-card p-5">
          <p className="text-sm font-medium text-muted-foreground">
            Present
          </p>

          <div className="mt-3 flex items-end justify-between">
            <p className="text-3xl font-bold text-card-foreground">
              {presentCount}
            </p>

            <span className="rounded-full bg-accent px-2.5 py-1 text-xs font-semibold text-accent-foreground">
              Present
            </span>
          </div>

          <p className="mt-3 text-xs text-muted-foreground">
            Attendance records
          </p>
        </div>

        {/* Absent */}

        <div className="rounded-xl border border-border bg-card p-5">
          <p className="text-sm font-medium text-muted-foreground">
            Absent
          </p>

          <div className="mt-3 flex items-end justify-between">
            <p className="text-3xl font-bold text-card-foreground">
              {absentCount}
            </p>

            <span className="rounded-full bg-destructive/10 px-2.5 py-1 text-xs font-semibold text-destructive">
              Absent
            </span>
          </div>

          <p className="mt-3 text-xs text-muted-foreground">
            Attendance records
          </p>
        </div>
      </div>

      {/* Assigned batches */}

      <section className="overflow-hidden rounded-xl border border-border bg-card">
        <div className="flex items-center justify-between border-b border-border px-6 py-5">
          <div>
            <h2 className="text-lg font-semibold text-card-foreground">
              Assigned Batches
            </h2>

            <p className="mt-1 text-sm text-muted-foreground">
              Current batches assigned to this teacher.
            </p>
          </div>

          <span className="rounded-full bg-accent px-3 py-1 text-xs font-semibold text-accent-foreground">
            {teacher.assignments.length}
          </span>
        </div>

        {teacher.assignments.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-sm text-muted-foreground">
              No batches assigned.
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
                  <div>
                    <p className="text-sm font-semibold text-card-foreground">
                      {batch.name}
                    </p>

                    <p className="mt-1 text-xs text-muted-foreground">
                      {batch.branch.name}
                    </p>
                  </div>

                  <span className="rounded-full bg-muted px-3 py-1 text-xs font-medium text-muted-foreground">
                    Assigned
                  </span>
                </div>
              ),
            )}
          </div>
        )}
      </section>

      {/* Attendance history */}

      <section className="overflow-hidden rounded-xl border border-border bg-card">
        <div className="border-b border-border px-6 py-5">
          <h2 className="text-lg font-semibold text-card-foreground">
            Attendance History
          </h2>

          <p className="mt-1 text-sm text-muted-foreground">
            Recent attendance records for this teacher.
          </p>
        </div>

        {attendance.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-sm text-muted-foreground">
              No attendance records found.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <div className="min-w-[600px]">
              {/* Table header */}

              <div className="grid grid-cols-[1fr_140px_1fr] border-b border-border bg-muted px-6 py-3">
                <span className="text-xs font-semibold text-muted-foreground">
                  Date
                </span>

                <span className="text-xs font-semibold text-muted-foreground">
                  Status
                </span>

                <span className="text-xs font-semibold text-muted-foreground">
                  Batch
                </span>
              </div>

              {/* Records */}

              <div className="divide-y divide-border">
                {attendance.map((record) => (
                  <div
                    key={record.id}
                    className="grid grid-cols-[1fr_140px_1fr] items-center px-6 py-4"
                  >
                    <span className="text-sm text-foreground">
                      {record.date.toLocaleDateString(
                        "en-IN",
                        {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        },
                      )}
                    </span>

                    <div>
                      {record.attended ===
                      "PRESENT" ? (
                        <span className="inline-flex rounded-full bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary">
                          Present
                        </span>
                      ) : (
                        <span className="inline-flex rounded-full bg-destructive/10 px-2.5 py-1 text-xs font-semibold text-destructive">
                          Absent
                        </span>
                      )}
                    </div>

                    <span className="text-sm text-muted-foreground">
                      {record.batchname}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}