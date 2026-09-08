import TeacherActions from "./TeacherAction";

import type { Prisma } from "@/generated/prisma/client";

import {
  Building2,
  Users,
} from "lucide-react";

type TeacherWithDetails = Prisma.TeacherGetPayload<{
  select: {
    id: true;

    user: {
      select: {
        name: true;
        email: true;
      };
    };

    assignments: {
      select: {
        batch: {
          select: {
            id: true;

            branch: {
              select: {
                id: true;
                name: true;
              };
            };
          };
        };
      };
    };
  };
}>;

type RankedTeacher = TeacherWithDetails & {
  attendancePercentage: number;
  rank: number;
};

interface TeacherTableProps {
  teachers: RankedTeacher[];
}

function getAttendanceColor(percentage: number) {
  if (percentage >= 90) return "bg-primary";
  if (percentage >= 75) return "bg-chart-2";
  if (percentage >= 50) return "bg-chart-4";
  return "bg-destructive";
}

export default function TeacherTable({
  teachers,
}: TeacherTableProps) {
  return (
    <>
      {/* =====================================================
          Desktop & Tablet
      ===================================================== */}

      <div className="hidden overflow-hidden rounded-xl border bg-card shadow-sm md:block">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-muted/50">
              <tr className="border-b">
                <th className="w-16 px-6 py-4 text-left font-semibold">
                  #
                </th>

                <th className="px-6 py-4 text-left font-semibold">
                  Teacher
                </th>

                <th className="px-6 py-4 text-left font-semibold">
                  Attendance
                </th>

                <th className="px-6 py-4 text-left font-semibold">
                  Branches
                </th>

                <th className="px-6 py-4 text-left font-semibold">
                  Batches
                </th>

                <th className="w-20 px-6 py-4 text-center font-semibold">
                  Actions
                </th>
              </tr>
            </thead>

            <tbody>
              {teachers.map((teacher) => {
                const batchCount =
                  teacher.assignments.length;

                const branchCount = new Set(
                  teacher.assignments.map(
                    (assignment) =>
                      assignment.batch.branch.id
                  )
                ).size;

                const attendanceColor =
                  getAttendanceColor(
                    teacher.attendancePercentage
                  );

                return (
                  <tr
                    key={teacher.id}
                    className="border-b transition hover:bg-muted/30"
                  >
                    {/* Rank */}

                    <td className="px-6 py-5 font-semibold">
                      {teacher.rank}
                    </td>

                    {/* Teacher */}

                    <td className="px-6 py-5">
                      <div>
                        <p className="font-semibold">
                          {teacher.user.name ?? "-"}
                        </p>

                        <p className="text-xs text-muted-foreground">
                          {teacher.user.email}
                        </p>
                      </div>
                    </td>

                    {/* Attendance */}

                    <td className="px-6 py-5">
                      <div className="flex items-center gap-3">
                        <div className="h-2 w-28 overflow-hidden rounded-full bg-muted">
                          <div
                            className={`h-full rounded-full ${attendanceColor}`}
                            style={{
                              width: `${teacher.attendancePercentage}%`,
                            }}
                          />
                        </div>

                        <span className="w-10 text-sm font-medium">
                          {teacher.attendancePercentage}%
                        </span>
                      </div>
                    </td>

                    {/* Branches */}

                    <td className="px-6 py-5">
                      <div className="inline-flex items-center gap-2 rounded-full bg-muted px-3 py-1 text-xs font-medium text-muted-foreground">
                        <Building2 className="h-3.5 w-3.5" />

                        {branchCount}
                      </div>
                    </td>

                    {/* Batches */}

                    <td className="px-6 py-5">
                      <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                        <Users className="h-3.5 w-3.5" />

                        {batchCount}
                      </div>
                    </td>

                    {/* Actions */}

                    <td className="px-6 py-5 text-center">
                      <TeacherActions
                        teacherId={teacher.id}
                        teacherName={teacher.user.name}
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* =====================================================
          Mobile
      ===================================================== */}

      <div className="grid gap-4 md:hidden">
        {teachers.map((teacher) => {
          const batchCount =
            teacher.assignments.length;

          const branchCount = new Set(
            teacher.assignments.map(
              (assignment) =>
                assignment.batch.branch.id
            )
          ).size;

          const attendanceColor =
            getAttendanceColor(
              teacher.attendancePercentage
            );

          return (
            <div
              key={teacher.id}
              className="rounded-xl border bg-card p-4 shadow-sm transition hover:shadow-md"
            >
              {/* Header */}

              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-muted-foreground">
                      #{teacher.rank}
                    </span>

                    <h2 className="truncate text-base font-semibold">
                      {teacher.user.name ?? "-"}
                    </h2>
                  </div>

                  <p className="mt-1 break-all text-xs text-muted-foreground">
                    {teacher.user.email}
                  </p>
                </div>

                <TeacherActions
                  teacherId={teacher.id}
                  teacherName={teacher.user.name}
                />
              </div>

              {/* Branches & Batches */}

              <div className="mt-4 grid grid-cols-2 gap-3">
                <div className="rounded-lg border bg-muted p-3">
                  <div className="mb-1 flex items-center gap-2 text-xs font-medium text-muted-foreground">
                    <Building2 className="h-3.5 w-3.5" />
                    Branches
                  </div>

                  <p className="text-lg font-semibold">
                    {branchCount}
                  </p>
                </div>

                <div className="rounded-lg border bg-accent p-3">
                  <div className="mb-1 flex items-center gap-2 text-xs font-medium text-muted-foreground">
                    <Users className="h-3.5 w-3.5" />
                    Batches
                  </div>

                  <p className="text-lg font-semibold">
                    {batchCount}
                  </p>
                </div>
              </div>

              {/* Attendance */}

              <div className="mt-5">
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-sm font-medium">
                    Attendance
                  </span>

                  <span className="text-sm font-semibold">
                    {teacher.attendancePercentage}%
                  </span>
                </div>

                <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className={`h-full rounded-full ${attendanceColor}`}
                    style={{
                      width: `${teacher.attendancePercentage}%`,
                    }}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Empty State */}

      {teachers.length === 0 && (
        <div className="rounded-xl border bg-card py-20 text-center shadow-sm">
          <p className="text-lg font-semibold">
            No teachers found
          </p>

          <p className="mt-2 text-sm text-muted-foreground">
            Try searching with a different name or email.
          </p>
        </div>
      )}
    </>
  );
}