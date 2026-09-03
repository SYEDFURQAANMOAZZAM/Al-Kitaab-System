import { notFound } from "next/navigation";

import { prisma } from "@/lib/prisma";

type StudentPerformancePageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function StudentPerformancePage({
  params,
}: StudentPerformancePageProps) {
  const { id } = await params;

  const student = await prisma.student.findUnique({
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

      enrollments: {
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

  if (!student) {
    notFound();
  }

  const [attendance, progress] =
    await Promise.all([
      prisma.attendance.findMany({
        where: {
          userId: student.userId,
        },
        select: {
          id: true,
          attended: true,
          remarks: true,
          date: true,
          batchname: true
        },
        orderBy: {
          date: "desc",
        },
      }),

      prisma.progress.findMany({
        where: {
          studentId: student.id,
        },
        select: {
          id: true,
          studied: true,
          remarks: true,
          score: true,
          date: true,
          batchname: true,
        },
        orderBy: {
          date: "desc",
        },
      }),
    ]);

  /* =========================================================
     Attendance calculations
  ========================================================= */

  const totalAttendance = attendance.length;

  const presentCount = attendance.filter(
    (record) => record.attended === "PRESENT",
  ).length;

  const absentCount = attendance.filter(
    (record) => record.attended === "ABSENT",
  ).length;

  const attendancePercentage =
    totalAttendance === 0
      ? 0
      : Math.round(
          (presentCount / totalAttendance) * 100,
        );

  /* =========================================================
     Progress calculations
  ========================================================= */

  const totalProgressRecords = progress.length;

  const studiedCount = progress.filter(
    (record) => record.studied === "YES",
  ).length;

  const notStudiedCount = progress.filter(
    (record) => record.studied === "NO",
  ).length;

  const totalScore = progress.reduce(
    (sum, record) => sum + (record.score ?? 0),
    0,
  );

  const averageScore =
    totalProgressRecords === 0
      ? 0
      : Math.round(
          (totalScore / totalProgressRecords) *
            10,
        ) / 10;

  const studiedPercentage =
    totalProgressRecords === 0
      ? 0
      : Math.round(
          (studiedCount /
            totalProgressRecords) *
            100,
        );

  return (
    <div className="space-y-6">
      {/* Header */}

      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          Student Performance
        </h1>

        <p className="mt-1 text-sm text-muted-foreground">
          Attendance and learning progress for{" "}
          <span className="font-semibold text-foreground">
            {student.user.name ?? "Unnamed"}
          </span>
        </p>
      </div>

      {/* =====================================================
          Attendance
      ===================================================== */}

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

            <span className="rounded-full bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-600">
              Absent
            </span>
          </div>

          <p className="mt-3 text-xs text-muted-foreground">
            Attendance records
          </p>
        </div>
      </div>

      {/* =====================================================
          Progress
      ===================================================== */}

      <section className="overflow-hidden rounded-xl border border-border bg-card">
        <div className="border-b border-border px-6 py-5">
          <h2 className="text-lg font-semibold text-card-foreground">
            Learning Progress
          </h2>

          <p className="mt-1 text-sm text-muted-foreground">
            Overview of the student&apos;s recorded
            progress.
          </p>
        </div>

        <div className="grid gap-4 p-6 sm:grid-cols-3">
          {/* Average Score */}

          <div className="rounded-lg border border-border p-4">
            <p className="text-sm font-medium text-muted-foreground">
              Average Score
            </p>

            <p className="mt-2 text-2xl font-bold text-card-foreground">
              {averageScore}
            </p>

            <p className="mt-1 text-xs text-muted-foreground">
              Across {totalProgressRecords}{" "}
              {totalProgressRecords === 1
                ? "record"
                : "records"}
            </p>
          </div>

          {/* Studied */}

          <div className="rounded-lg border border-border p-4">
            <p className="text-sm font-medium text-muted-foreground">
              Studied
            </p>

            <div className="mt-2 flex items-end justify-between">
              <p className="text-2xl font-bold text-card-foreground">
                {studiedCount}
              </p>

              <span className="rounded-full bg-accent px-2.5 py-1 text-xs font-semibold text-accent-foreground">
                {studiedPercentage}%
              </span>
            </div>

            <p className="mt-1 text-xs text-muted-foreground">
              Progress records
            </p>
          </div>

          {/* Not Studied */}

          <div className="rounded-lg border border-border p-4">
            <p className="text-sm font-medium text-muted-foreground">
              Not Studied
            </p>

            <p className="mt-2 text-2xl font-bold text-card-foreground">
              {notStudiedCount}
            </p>

            <p className="mt-1 text-xs text-muted-foreground">
              Progress records
            </p>
          </div>
        </div>
      </section>

      {/* =====================================================
          Assigned Batches
      ===================================================== */}

      <section className="overflow-hidden rounded-xl border border-border bg-card">
        <div className="flex items-center justify-between border-b border-border px-6 py-5">
          <div>
            <h2 className="text-lg font-semibold text-card-foreground">
              Assigned Batches
            </h2>

            <p className="mt-1 text-sm text-muted-foreground">
              Current batches assigned to this student.
            </p>
          </div>

          <span className="rounded-full bg-accent px-3 py-1 text-xs font-semibold text-accent-foreground">
            {student.enrollments.length}
          </span>
        </div>

        {student.enrollments.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-sm text-muted-foreground">
              No batches assigned.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {student.enrollments.map(
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

      {/* =====================================================
          Progress History
      ===================================================== */}

      <section className="overflow-hidden rounded-xl border border-border bg-card">
        <div className="border-b border-border px-6 py-5">
          <h2 className="text-lg font-semibold text-card-foreground">
            Progress History
          </h2>

          <p className="mt-1 text-sm text-muted-foreground">
            Recorded learning progress for this student.
          </p>
        </div>

        {progress.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-sm text-muted-foreground">
              No progress records found.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <div className="min-w-[700px]">
              <div className="grid grid-cols-[1fr_120px_100px_1fr] border-b border-border bg-muted px-6 py-3">
                <span className="text-xs font-semibold text-muted-foreground">
                  Date
                </span>

                <span className="text-xs font-semibold text-muted-foreground">
                  Studied
                </span>

                <span className="text-xs font-semibold text-muted-foreground">
                  Score
                </span>

                <span className="text-xs font-semibold text-muted-foreground">
                  Batch
                </span>
              </div>

              <div className="divide-y divide-border">
                {progress.map((record) => (
                  <div
                    key={record.id}
                    className="grid grid-cols-[1fr_120px_100px_1fr] items-center px-6 py-4"
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
                      {record.studied ===
                      "YES" ? (
                        <span className="inline-flex rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                          Yes
                        </span>
                      ) : (
                        <span className="inline-flex rounded-full bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-600">
                          No
                        </span>
                      )}
                    </div>

                    <span className="text-sm font-semibold text-foreground">
                      {record.score ?? 0}
                    </span>

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

      {/* =====================================================
          Attendance History
      ===================================================== */}

      <section className="overflow-hidden rounded-xl border border-border bg-card">
        <div className="border-b border-border px-6 py-5">
          <h2 className="text-lg font-semibold text-card-foreground">
            Attendance History
          </h2>

          <p className="mt-1 text-sm text-muted-foreground">
            Recent attendance records for this student.
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
                        <span className="inline-flex rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                          Present
                        </span>
                      ) : (
                        <span className="inline-flex rounded-full bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-600">
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