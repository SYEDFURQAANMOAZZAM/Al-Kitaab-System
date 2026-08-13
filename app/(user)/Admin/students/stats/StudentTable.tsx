import { Progress } from "@/components/ui/progress";
import type { Prisma } from "@/generated/prisma/client";

import {
  Building2,
  Users,
} from "lucide-react";
import StudentActions from "./StudentActions";

type StudentWithDetails = Prisma.StudentGetPayload<{
  select: {
    id: true;

    user: {
      select: {
        name: true;
        email: true;
      };
    };

    enrollments: {
      select: {
        batch: {
          select: {
            id: true;
            branch: {
              select: {
                name: true;
              };
            };
          };
        };
      };
    };
  };
}>;

type StudentTableProps = {
  students: StudentWithDetails[];
  currentPage: number;
  pageSize: number;
};



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
                  Batches
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

                const batchCount =
                  student.enrollments.length;

                return (
                  <tr
                    key={student.id}
                    className="border-b transition hover:bg-muted/30"
                  >
                    {/* Number */}

                    <td className="px-6 py-5">
                      {(currentPage - 1) * pageSize +
                        index +
                        1}
                    </td>

                    {/* Student */}

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

                    {/* Branch */}

                    <td className="px-6 py-5">
                      <div className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">
                        <Building2 className="h-3.5 w-3.5" />

                        {enrollment?.batch.branch.name ??
                          "-"}
                      </div>
                    </td>

                    {/* Number of Batches */}

                    <td className="px-6 py-5">
                      <div className="inline-flex items-center gap-2 rounded-full bg-emerald-100 px-3 py-1 text-xs font-medium text-emerald-700">
                        <Users className="h-3.5 w-3.5" />

                        {batchCount}
                      </div>
                    </td>

                    {/* Attendance */}

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

                    {/* Progress */}

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

                    {/* Actions */}

                    <td className="px-6 py-5 text-center">
                      <StudentActions studentId={student.id} />
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
        {students.map((student, index) => {
          const enrollment =
            student.enrollments?.[0];

          const batchCount =
            student.enrollments.length;

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

                <StudentActions studentId={student.id} />
              </div>

              {/* Branch & Batches */}

              <div className="mt-4 grid grid-cols-2 gap-3">
                {/* Branch */}

                <div className="rounded-lg border bg-slate-50 p-3">
                  <div className="mb-1 flex items-center gap-2 text-xs font-medium text-muted-foreground">
                    <Building2 className="h-3.5 w-3.5" />
                    Branch
                  </div>

                  <p className="truncate text-sm font-semibold">
                    {enrollment?.batch.branch.name ??
                      "-"}
                  </p>
                </div>

                {/* Number of Batches */}

                <div className="rounded-lg border bg-emerald-50 p-3">
                  <div className="mb-1 flex items-center gap-2 text-xs font-medium text-muted-foreground">
                    <Users className="h-3.5 w-3.5" />
                    Batches
                  </div>

                  <p className="text-sm font-semibold">
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

              {/* Number */}

              <p className="mt-4 text-xs text-muted-foreground">
                #
                {(currentPage - 1) * pageSize +
                  index +
                  1}
              </p>
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