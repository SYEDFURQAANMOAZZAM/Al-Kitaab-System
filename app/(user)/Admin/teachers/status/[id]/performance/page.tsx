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
        <h1 className="text-3xl font-bold tracking-tight text-emerald-900">
          Teacher Performance
        </h1>

        <p className="mt-1 text-sm text-slate-600">
          Attendance and assignment overview for{" "}
          <span className="font-semibold text-slate-800">
            {teacher.user.name ?? "Unnamed"}
          </span>
        </p>
      </div>

      {/* Attendance summary */}

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

      {/* Assigned batches */}

      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">
              Assigned Batches
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Current batches assigned to this teacher.
            </p>
          </div>

          <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
            {teacher.assignments.length}
          </span>
        </div>

        {teacher.assignments.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-sm text-slate-500">
              No batches assigned.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-200">
            {teacher.assignments.map(
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

      {/* Attendance history */}

      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <div className="border-b border-slate-200 px-6 py-5">
          <h2 className="text-lg font-semibold text-slate-900">
            Attendance History
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Recent attendance records for this teacher.
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
              {/* Table header */}

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

              {/* Records */}

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