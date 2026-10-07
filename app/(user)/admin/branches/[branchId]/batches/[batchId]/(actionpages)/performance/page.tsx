import { notFound } from "next/navigation";

import { requireRole } from "@/lib/auth/require-role";

import {
  getLiveBatchPerformance,
} from "@/app/ServerActions/batchPerformance/queries";

import BatchPerformanceHeader from "@/components/BatchPerformance/BatchPerformanceHeader";
import BatchPerformanceMonthControls from "@/components/BatchPerformance/BatchPerformanceMonthControls";
import BatchAttendanceTakenTable from "@/components/BatchPerformance/BatchAttendanceTakenTable";
import TeacherAttendanceTable from "@/components/BatchPerformance/TeacherAttendanceTable";
import StudentAttendanceTable from "@/components/BatchPerformance/StudentAttendanceTable";
import BatchStudentProgress from "@/components/BatchPerformance/BatchStudentProgress";

type Props = {
  params: Promise<{
    branchId: string;
    batchId: string;
  }>;
  searchParams: Promise<{
    year?: string;
    month?: string;
  }>;
};

function getCurrentMonth() {
  const now = new Date();

  return {
    year: now.getFullYear(),
    month: now.getMonth() + 1,
  };
}

function getDaysInMonth(
  year: number,
  month: number
) {
  const count = new Date(
    Date.UTC(year, month, 0)
  ).getUTCDate();

  return Array.from(
    { length: count },
    (_, index) => {
      const date = new Date(
        Date.UTC(
          year,
          month - 1,
          index + 1
        )
      );

      return date.toISOString().slice(0, 10);
    }
  );
}

export default async function BatchPerformancePage({
  params,
  searchParams,
}: Props) {
  await requireRole("ADMIN", "TEACHER");

  const { batchId } = await params;
  const search = await searchParams;

  const current = getCurrentMonth();

  const year =
    Number(search.year) || current.year;

  const month =
    Number(search.month) || current.month;

  /*
   * Validate requested month.
   */
  if (
    !Number.isInteger(year) ||
    !Number.isInteger(month) ||
    month < 1 ||
    month > 12 ||
    year < 2000 ||
    year > 2100
  ) {
    notFound();
  }

  /*
   * Fetch batch performance.
   */
  const performance =
    await getLiveBatchPerformance(
      batchId,
      year,
      month
    );

  /*
   * Generate all days for the selected month.
   */
  const days = getDaysInMonth(
    year,
    month
  );

  /*
   * Only the information required by
   * BatchStudentProgress is passed here.
   */
  const students = performance.students.map(
    (student) => ({
      id: student.id,
      name: student.name,
    })
  );

  return (
    <main className="mx-auto w-full min-w-0 max-w-[1800px] p-2 sm:p-3">
      <div className="flex w-full min-w-0 flex-col gap-6">
        {/* HEADER */}
        <section className="flex w-full min-w-0 flex-col gap-4">
          <BatchPerformanceHeader
            batchName={performance.batch.name}
            batchId={batchId}
            year={year}
            month={month}
          />

          <div className="flex w-full justify-end">
            <BatchPerformanceMonthControls
              year={year}
              month={month}
            />
          </div>
        </section>

        {/* BATCH ATTENDANCE TAKEN */}
        <section className="w-full min-w-0">
          <BatchAttendanceTakenTable
            days={performance.attendanceTaken}
          />
        </section>

        {/* TEACHER ATTENDANCE */}
        <section className="w-full min-w-0">
          <TeacherAttendanceTable
            teachers={performance.teachers}
            days={days}
          />
        </section>

        {/* STUDENT ATTENDANCE */}
        <section className="w-full min-w-0">
          <StudentAttendanceTable
            students={performance.students}
            days={days}
          />
        </section>

        {/* STUDENT PROGRESS */}
        <section className="w-full min-w-0">
          <BatchStudentProgress
            students={students}
            batchId={batchId}
            year={year}
            month={month}
          />
        </section>
      </div>
    </main>
  );
} 