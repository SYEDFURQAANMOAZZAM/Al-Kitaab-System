import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { Progress } from "@/components/ui/progress";

import {
  Building2,
  Eye,
  MoreVertical,
  Pencil,
  Trash2,
  Users,
} from "lucide-react";

type StudentTableProps = {
  students: any[];
  currentPage: number;
  pageSize: number;
};

function StudentActions() {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="rounded-md p-2 transition hover:bg-muted">
        <MoreVertical className="h-5 w-5" />
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end">
        <DropdownMenuItem>
          <Eye className="mr-2 h-4 w-4" />
          View Profile
        </DropdownMenuItem>

        <DropdownMenuItem>
          <Pencil className="mr-2 h-4 w-4" />
          Edit Student
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <DropdownMenuItem variant="destructive">
          <Trash2 className="mr-2 h-4 w-4" />
          Delete Student
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export default function StudentTable({
  students,
  currentPage,
  pageSize,
}: StudentTableProps) {
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
                  Student
                </th>

                <th className="px-6 py-4 text-left font-semibold">
                  Branch
                </th>

                <th className="px-6 py-4 text-left font-semibold">
                  Batch
                </th>

                <th className="w-64 px-6 py-4 text-left font-semibold">
                  Attendance
                </th>

                <th className="w-64 px-6 py-4 text-left font-semibold">
                  Progress
                </th>

                <th className="w-20 px-6 py-4 text-center font-semibold">
                  Actions
                </th>
              </tr>
            </thead>

            <tbody>
              {students.map((student, index) => {
                const enrollment =
                  student.enrollments?.[0];

                return (
                  <tr
                    key={student.id}
                    className="border-b transition hover:bg-muted/30"
                  >
                    <td className="px-6 py-5">
                      {(currentPage - 1) * pageSize + index + 1}
                    </td>

                    <td className="px-6 py-5">
                      <div>
                        <p className="font-semibold">
                          {student.user.name}
                        </p>

                        <p className="text-xs text-muted-foreground">
                          {student.user.email}
                        </p>
                      </div>
                    </td>

                    <td className="px-6 py-5">
                      <div className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">
                        <Building2 className="h-3.5 w-3.5" />

                        {enrollment?.batch.branch.name ??
                          "-"}
                      </div>
                    </td>

                    <td className="px-6 py-5">
                      <div className="inline-flex items-center gap-2 rounded-full bg-emerald-100 px-3 py-1 text-xs font-medium text-emerald-700">
                        <Users className="h-3.5 w-3.5" />

                        {enrollment?.batch.name ?? "-"}
                      </div>
                    </td>

                    <td className="px-6 py-5">
                      <div className="flex items-center gap-3">
                        <Progress
                          value={75}
                          className="h-2"
                        />

                        <span className="w-10 text-sm font-medium">
                          75%
                        </span>
                      </div>
                    </td>

                    <td className="px-6 py-5">
                      <div className="flex items-center gap-3">
                        <Progress
                          value={62}
                          className="h-2"
                        />

                        <span className="w-10 text-sm font-medium">
                          62%
                        </span>
                      </div>
                    </td>

                    <td className="px-6 py-5 text-center">
                      <StudentActions />
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
        {students.map((student) => {
          const enrollment = student.enrollments?.[0];

          return (
            <div
              key={student.id}
              className="rounded-xl border bg-white p-4 shadow-sm transition hover:shadow-md"
            >
              {/* Header */}
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <h2 className="truncate text-base font-semibold">
                    {student.user.name}
                  </h2>

                  <p className="mt-1 break-all text-xs text-muted-foreground">
                    {student.user.email}
                  </p>
                </div>

                <StudentActions />
              </div>

              {/* Branch & Batch */}
              <div className="mt-4 grid grid-cols-2 gap-3">
                <div className="rounded-lg border bg-slate-50 p-3">
                  <div className="mb-1 flex items-center gap-2 text-xs font-medium text-muted-foreground">
                    <Building2 className="h-3.5 w-3.5" />
                    Branch
                  </div>

                  <p className="truncate text-sm font-semibold">
                    {enrollment?.batch.branch.name ?? "-"}
                  </p>
                </div>

                <div className="rounded-lg border bg-emerald-50 p-3">
                  <div className="mb-1 flex items-center gap-2 text-xs font-medium text-muted-foreground">
                    <Users className="h-3.5 w-3.5" />
                    Batch
                  </div>

                  <p className="truncate text-sm font-semibold">
                    {enrollment?.batch.name ?? "-"}
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
                    75%
                  </span>
                </div>

                <Progress
                  value={75}
                  className="h-2"
                />
              </div>

              {/* Progress */}
              <div className="mt-5">
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-sm font-medium">
                    Progress
                  </span>

                  <span className="text-sm font-semibold">
                    62%
                  </span>
                </div>

                <Progress
                  value={62}
                  className="h-2"
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Empty State */}

      {students.length === 0 && (
        <div className="rounded-xl border bg-white py-20 text-center shadow-sm">
          <p className="text-lg font-semibold">
            No students found
          </p>

          <p className="mt-2 text-sm text-muted-foreground">
            Try searching with a different name or email.
          </p>
        </div>
      )}
    </>
  );
}