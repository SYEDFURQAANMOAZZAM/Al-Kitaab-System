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
    (sum, record) => sum + record.score,
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
        <h1 className="text-3xl font-bold tracking-tight text-emerald-900">
          Student Performance
        </h1>

        <p className="mt-1 text-sm text-slate-600">
          Attendance and learning progress for{" "}
          <span className="font-semibold text-slate-800">
            {student.user.name ?? "Unnamed"}
          </span>
        </p>
      </div>

      {/* =====================================================
          Attendance
      ===================================================== */}

      <div className="grid gap-4 sm:grid-cols-3">
        {/* Attendance */}

        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <p className="text-sm font-medium text-slate-500">
            Attendance
          </p>

          <div className="mt-3 flex items-end justify-between">
            <p className="text-3xl font-bold text-slate-900">
              {attendancePercentage}%
            </p>

            <span className="text-xs font-medium text-slate-500">
              Overall
            </span>
          </div>

          <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full bg-emerald-600"
              style={{
                width: `${attendancePercentage}%`,
              }}
            />
          </div>
        </div>

        {/* Present */}

        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <p className="text-sm font-medium text-slate-500">
            Present
          </p>

          <div className="mt-3 flex items-end justify-between">
            <p className="text-3xl font-bold text-slate-900">
              {presentCount}
            </p>

            <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
              Present
            </span>
          </div>

          <p className="mt-3 text-xs text-slate-500">
            Attendance records
          </p>
        </div>

        {/* Absent */}

        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <p className="text-sm font-medium text-slate-500">
            Absent
          </p>

          <div className="mt-3 flex items-end justify-between">
            <p className="text-3xl font-bold text-slate-900">
              {absentCount}
            </p>

            <span className="rounded-full bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-600">
              Absent
            </span>
          </div>

          <p className="mt-3 text-xs text-slate-500">
            Attendance records
          </p>
        </div>
      </div>

      {/* =====================================================
          Progress
      ===================================================== */}

      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <div className="border-b border-slate-200 px-6 py-5">
          <h2 className="text-lg font-semibold text-slate-900">
            Learning Progress
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Overview of the student&apos;s recorded
            progress.
          </p>
        </div>

        <div className="grid gap-4 p-6 sm:grid-cols-3">
          {/* Average Score */}

          <div className="rounded-lg border border-slate-200 p-4">
            <p className="text-sm font-medium text-slate-500">
              Average Score
            </p>

            <p className="mt-2 text-2xl font-bold text-slate-900">
              {averageScore}
            </p>

            <p className="mt-1 text-xs text-slate-500">
              Across {totalProgressRecords}{" "}
              {totalProgressRecords === 1
                ? "record"
                : "records"}
            </p>
          </div>

          {/* Studied */}

          <div className="rounded-lg border border-slate-200 p-4">
            <p className="text-sm font-medium text-slate-500">
              Studied
            </p>

            <div className="mt-2 flex items-end justify-between">
              <p className="text-2xl font-bold text-slate-900">
                {studiedCount}
              </p>

              <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                {studiedPercentage}%
              </span>
            </div>

            <p className="mt-1 text-xs text-slate-500">
              Progress records
            </p>
          </div>

          {/* Not Studied */}

          <div className="rounded-lg border border-slate-200 p-4">
            <p className="text-sm font-medium text-slate-500">
              Not Studied
            </p>

            <p className="mt-2 text-2xl font-bold text-slate-900">
              {notStudiedCount}
            </p>

            <p className="mt-1 text-xs text-slate-500">
              Progress records
            </p>
          </div>
        </div>
      </section>

      {/* =====================================================
          Assigned Batches
      ===================================================== */}

      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">
              Assigned Batches
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Current batches assigned to this student.
            </p>
          </div>

          <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
            {student.enrollments.length}
          </span>
        </div>

        {student.enrollments.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-sm text-slate-500">
              No batches assigned.
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
                  <div>
                    <p className="text-sm font-semibold text-slate-900">
                      {batch.name}
                    </p>

                    <p className="mt-1 text-xs text-slate-500">
                      {batch.branch.name}
                    </p>
                  </div>

                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
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

      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <div className="border-b border-slate-200 px-6 py-5">
          <h2 className="text-lg font-semibold text-slate-900">
            Progress History
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Recorded learning progress for this student.
          </p>
        </div>

        {progress.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-sm text-slate-500">
              No progress records found.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <div className="min-w-[700px]">
              <div className="grid grid-cols-[1fr_120px_100px_1fr] border-b border-slate-200 bg-slate-50 px-6 py-3">
                <span className="text-xs font-semibold text-slate-600">
                  Date
                </span>

                <span className="text-xs font-semibold text-slate-600">
                  Studied
                </span>

                <span className="text-xs font-semibold text-slate-600">
                  Score
                </span>

                <span className="text-xs font-semibold text-slate-600">
                  Batch
                </span>
              </div>

              <div className="divide-y divide-slate-200">
                {progress.map((record) => (
                  <div
                    key={record.id}
                    className="grid grid-cols-[1fr_120px_100px_1fr] items-center px-6 py-4"
                  >
                    <span className="text-sm text-slate-700">
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

                    <span className="text-sm font-semibold text-slate-800">
                      {record.score}
                    </span>

                    <span className="text-sm text-slate-600">
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

      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <div className="border-b border-slate-200 px-6 py-5">
          <h2 className="text-lg font-semibold text-slate-900">
            Attendance History
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Recent attendance records for this student.
          </p>
        </div>

        {attendance.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-sm text-slate-500">
              No attendance records found.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <div className="min-w-[600px]">
              <div className="grid grid-cols-[1fr_140px_1fr] border-b border-slate-200 bg-slate-50 px-6 py-3">
                <span className="text-xs font-semibold text-slate-600">
                  Date
                </span>

                <span className="text-xs font-semibold text-slate-600">
                  Status
                </span>

                <span className="text-xs font-semibold text-slate-600">
                  Batch
                </span>
              </div>

              <div className="divide-y divide-slate-200">
                {attendance.map((record) => (
                  <div
                    key={record.id}
                    className="grid grid-cols-[1fr_140px_1fr] items-center px-6 py-4"
                  >
                    <span className="text-sm text-slate-700">
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

                    <span className="text-sm text-slate-600">
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