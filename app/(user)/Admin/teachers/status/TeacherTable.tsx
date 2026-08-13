import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import type { Prisma } from "@/generated/prisma/client";

import {
  Building2,
  Eye,
  MoreVertical,
  Pencil,
  Trash2,
  Users,
} from "lucide-react";

type TeacherWithDetails = Prisma.TeacherGetPayload<{
  select: {
    id: true;

    user: {
      select: {
        name: true;
        email: true;

        attendance: {
          select: {
            attended: true;
          };
        };
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

type TeacherTableProps = {
  teachers: TeacherWithDetails[];
  currentPage: number;
  pageSize: number;
};

function TeacherActions() {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="rounded-lg p-2 hover:bg-muted">
        <MoreVertical className="h-4 w-4" />
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end">
        <DropdownMenuItem>
          <Eye className="mr-2 h-4 w-4" />
          View Profile
        </DropdownMenuItem>

        <DropdownMenuItem>
          <Pencil className="mr-2 h-4 w-4" />
          Edit Teacher
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <DropdownMenuItem variant="destructive">
          <Trash2 className="mr-2 h-4 w-4" />
          Delete Teacher
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export default function TeacherTable({
  teachers,
  currentPage,
  pageSize,
}: TeacherTableProps) {
  return (
    <>
      {/* ===========================
          Desktop & Tablet
      ============================ */}

      <div className="hidden overflow-hidden rounded-xl border bg-white shadow-sm md:block">
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
              {teachers.map((teacher, index) => {
                const attendance = teacher.user.attendance;

                const totalAttendance = attendance.length;

                const presentCount = attendance.filter(
                  (record) =>
                    record.attended === "PRESENT"
                ).length;

                const attendancePercentage =
                  totalAttendance > 0
                    ? Math.round(
                        (presentCount / totalAttendance) * 100
                      )
                    : 0;

                const batchCount =
                  teacher.assignments.length;

                const branchCount = new Set(
                  teacher.assignments.map(
                    (assignment) =>
                      assignment.batch.branch.id
                  )
                ).size;

                return (
                  <tr
                    key={teacher.id}
                    className="border-b transition hover:bg-muted/30"
                  >
                    {/* Number */}

                    <td className="px-6 py-5">
                      {(currentPage - 1) * pageSize +
                        index +
                        1}
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
                            className="h-full rounded-full bg-emerald-600"
                            style={{
                              width: `${attendancePercentage}%`,
                            }}
                          />
                        </div>

                        <span className="w-10 text-sm font-medium">
                          {attendancePercentage}%
                        </span>
                      </div>
                    </td>

                    {/* Branches */}

                    <td className="px-6 py-5">
                      <div className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">
                        <Building2 className="h-3.5 w-3.5" />

                        {branchCount}
                      </div>
                    </td>

                    {/* Batches */}

                    <td className="px-6 py-5">
                      <div className="inline-flex items-center gap-2 rounded-full bg-emerald-100 px-3 py-1 text-xs font-medium text-emerald-700">
                        <Users className="h-3.5 w-3.5" />

                        {batchCount}
                      </div>
                    </td>

                    {/* Actions */}

                    <td className="px-6 py-5 text-center">
                      <TeacherActions />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ===========================
          Mobile
      ============================ */}

      <div className="grid gap-4 md:hidden">
        {teachers.map((teacher, index) => {
          const attendance = teacher.user.attendance;

          const totalAttendance = attendance.length;

          const presentCount = attendance.filter(
            (record) =>
              record.attended === "PRESENT"
          ).length;

          const attendancePercentage =
            totalAttendance > 0
              ? Math.round(
                  (presentCount / totalAttendance) * 100
                )
              : 0;

          const batchCount =
            teacher.assignments.length;

          const branchCount = new Set(
            teacher.assignments.map(
              (assignment) =>
                assignment.batch.branch.id
            )
          ).size;

          return (
            <div
              key={teacher.id}
              className="rounded-xl border bg-white p-4 shadow-sm transition hover:shadow-md"
            >
              {/* Header */}

              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <h2 className="truncate text-base font-semibold">
                    {teacher.user.name ?? "-"}
                  </h2>

                  <p className="mt-1 break-all text-xs text-muted-foreground">
                    {teacher.user.email}
                  </p>
                </div>

                <TeacherActions />
              </div>

              {/* Branches & Batches */}

              <div className="mt-4 grid grid-cols-2 gap-3">
                <div className="rounded-lg border bg-slate-50 p-3">
                  <div className="mb-1 flex items-center gap-2 text-xs font-medium text-muted-foreground">
                    <Building2 className="h-3.5 w-3.5" />

                    Branches
                  </div>

                  <p className="text-lg font-semibold">
                    {branchCount}
                  </p>
                </div>

                <div className="rounded-lg border bg-emerald-50 p-3">
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
                    {attendancePercentage}%
                  </span>
                </div>

                <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-emerald-600"
                    style={{
                      width: `${attendancePercentage}%`,
                    }}
                  />
                </div>
              </div>

              {/* Number */}

              <p className="mt-4 text-xs text-muted-foreground">
                #{(currentPage - 1) * pageSize + index + 1}
              </p>
            </div>
          );
        })}
      </div>

      {/* Empty State */}

      {teachers.length === 0 && (
        <div className="rounded-xl border bg-white py-20 text-center shadow-sm">
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