import type { Prisma } from "@/generated/prisma/client";

import {
  Building2,
  Users,
} from "lucide-react";

import StudentActions from "./StudentActions";

/* =========================================================
   STUDENT DATA TYPE
========================================================= */

type StudentWithDetails =
  Prisma.StudentGetPayload<{
    select: {
      id: true;
      userId: true;

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
              name: true;

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

type StudentTableStudent =
  StudentWithDetails & {
    stats: {
      attendance: number;
      progress: number;
      progressScore: number;
      overall: number;
    };

    rank: number;
  };

interface Props {
  students: StudentTableStudent[];
}

/* =========================================================
   PROGRESS COLOR
========================================================= */

function Color(percentage: number) {
  if (percentage >= 90) {
    return "bg-primary";
  }

  if (percentage >= 70) {
    return "bg-chart-2";
  }

  if (percentage >= 50) {
    return "bg-chart-4";
  }

  return "bg-destructive";
}

/* =========================================================
   STUDENT TABLE
========================================================= */

export default function StudentTable({
  students,
}: Props) {
  return (
    <>
      {/* =====================================================
          DESKTOP / TABLET
      ===================================================== */}

      <div className="hidden overflow-hidden rounded-xl border bg-card shadow-sm md:block">
        <div className="overflow-x-auto">
          <table className="min-w-full table-fixed text-sm">
            {/* =================================================
                HEADER
            ================================================= */}

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

                <th className="w-64 px-6 py-4 text-left font-semibold">
                  Scores
                </th>

                <th className="w-20 px-6 py-4 text-center font-semibold">
                  Actions
                </th>
              </tr>
            </thead>

            {/* =================================================
                BODY
            ================================================= */}

            <tbody>
              {students.map((student) => {
                const branchCount =
                  new Set(
                    student.enrollments.map(
                      (enrollment) =>
                        enrollment.batch.branch.id
                    )
                  ).size;

                const batchCount =
                  student.enrollments.length;

                const attendance =
                  Math.round(
                    student.stats.attendance
                  );

                const progress =
                  Math.round(
                    student.stats.progress
                  );

                const progressScore =
                  Math.round(
                    student.stats.progressScore
                  );

                return (
                  <tr
                    key={student.id}
                    className="border-b transition hover:bg-muted/30"
                  >
                    {/* =========================================
                        RANK
                    ========================================= */}

                    <td className="px-6 py-5 font-semibold">
                      {student.rank}
                    </td>

                    {/* =========================================
                        STUDENT
                    ========================================= */}

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

                    {/* =========================================
                        BRANCH
                    ========================================= */}

                    <td className="px-6 py-5">
                      <div className="inline-flex items-center gap-2 rounded-full bg-muted px-3 py-1 text-xs font-medium text-muted-foreground">
                        <Building2 className="h-3.5 w-3.5" />

                        {branchCount}
                      </div>
                    </td>

                    {/* =========================================
                        BATCHES
                    ========================================= */}

                    <td className="px-6 py-5">
                      <div className="inline-flex items-center gap-2 rounded-full bg-accent px-3 py-1 text-xs font-medium text-accent-foreground">
                        <Users className="h-3.5 w-3.5" />

                        {batchCount}
                      </div>
                    </td>

                    {/* =========================================
                        ATTENDANCE
                    ========================================= */}

                    <td className="px-6 py-5">
                      <div className="flex items-center justify-center gap-3">
                        <span className="w-10 text-sm font-medium">
                          {attendance}%
                        </span>
                      </div>
                    </td>

                    {/* =========================================
                        PROGRESS
                    ========================================= */}

                    <td className="px-6 py-5">
                      <div className="flex items-center justify-center gap-3">
                        <span className="w-10 text-sm font-medium">
                          {progress}%
                        </span>
                      </div>
                    </td>

                    {/* =========================================
                        SCORE
                    ========================================= */}

                    <td className="px-6 py-5">
                        <span className="inline-flex min-w-[52px] items-center justify-center px-3 py-1.5 text-sm font-semibold tabular-nums">
                          {progressScore}%
                        </span>
                    </td>

                    {/* =========================================
                        ACTIONS
                    ========================================= */}

                    <td className="px-6 py-5 text-center">
                      <StudentActions
                        studentId={student.id}
                        studentName={
                          student.user.name
                        }
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
          MOBILE
      ===================================================== */}

      <div className="grid gap-4 md:hidden">
        {students.map((student) => {
          const batchCount =
            student.enrollments.length;

          const branchCount =
            new Set(
              student.enrollments.map(
                (enrollment) =>
                  enrollment.batch.branch.id
              )
            ).size;

          const attendance =
            Math.round(
              student.stats.attendance
            );

          const progress =
            Math.round(
              student.stats.progress
            );

          const progressScore =
            Math.round(
              student.stats.progressScore
            );

          const attendanceColor =
            Color(attendance);

          const progressColor =
            Color(progress);

          return (
            <div
              key={student.id}
              className="rounded-xl border bg-card p-4 shadow-sm transition hover:shadow-md"
            >
              {/* =============================================
                  HEADER
              ============================================= */}

              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-muted-foreground">
                      #{student.rank}
                    </span>

                    <h2 className="truncate text-base font-semibold">
                      {student.user.name}
                    </h2>
                  </div>

                  <p className="mt-1 break-all text-xs text-muted-foreground">
                    {student.user.email}
                  </p>
                </div>

                <StudentActions
                  studentId={student.id}
                  studentName={
                    student.user.name
                  }
                />
              </div>

              {/* =============================================
                  BRANCH & BATCHES
              ============================================= */}

              <div className="mt-4 grid grid-cols-2 gap-3">
                <div className="rounded-lg border bg-muted p-3">
                  <div className="mb-1 flex items-center gap-2 text-xs font-medium text-muted-foreground">
                    <Building2 className="h-3.5 w-3.5" />

                    Branches
                  </div>

                  <p className="text-sm font-semibold">
                    {branchCount}
                  </p>
                </div>

                <div className="rounded-lg border bg-accent p-3">
                  <div className="mb-1 flex items-center gap-2 text-xs font-medium text-muted-foreground">
                    <Users className="h-3.5 w-3.5" />

                    Batches
                  </div>

                  <p className="text-sm font-semibold">
                    {batchCount}
                  </p>
                </div>
              </div>

              {/* =============================================
                  ATTENDANCE
              ============================================= */}

              <div className="mt-5">
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-sm font-medium">
                    Attendance
                  </span>

                  <span className="text-sm font-semibold">
                    {attendance}%
                  </span>
                </div>

                <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className={`h-full rounded-full ${attendanceColor}`}
                    style={{
                      width: `${attendance}%`,
                    }}
                  />
                </div>
              </div>

              {/* =============================================
                  PROGRESS
              ============================================= */}

              <div className="mt-5">
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-sm font-medium">
                    Progress
                  </span>

                  <span className="text-sm font-semibold">
                    {progress}%
                  </span>
                </div>

                <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className={`h-full rounded-full ${progressColor}`}
                    style={{
                      width: `${progress}%`,
                    }}
                  />
                </div>
              </div>

              {/* =============================================
                  SCORE
              ============================================= */}

              <span className="mt-5 inline-flex min-w-[52px] items-center justify-center rounded-lg border bg-muted/50 px-3 py-1.5 text-sm font-semibold tabular-nums">
                {progressScore}% Progress Score
              </span>
            </div>
          );
        })}
      </div>

      {/* =====================================================
          EMPTY STATE
      ===================================================== */}

      {students.length === 0 && (
        <div className="rounded-xl border bg-card py-20 text-center shadow-sm">
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