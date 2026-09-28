import { notFound } from "next/navigation";

import { requireRole } from "@/lib/auth/require-role";

import {
  getBatchPerformance,
} from "@/app/ServerActions/batchPerformance/queries";

import BatchPerformanceHeader from "@/components/BatchPerformance/BatchPerformanceHeader";
import BatchPerformanceMonthControls from "@/components/BatchPerformance/BatchPerformanceMonthControls";
import BatchAttendanceTakenTable from "@/components/BatchPerformance/BatchAttendanceTakenTable";
import TeacherAttendanceTable from "@/components/BatchPerformance/TeacherAttendanceTable";
import StudentAttendanceTable from "@/components/BatchPerformance/StudentAttendanceTable";
import BatchStudentProgress from "@/components/BatchPerformance/BatchStudentProgress";

type Props = {
  params: Promise<{
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
  await requireRole("ADMIN");

  const { batchId } = await params;

  const search = await searchParams;

  const current = getCurrentMonth();

  const year =
    Number(search.year) || current.year;

  const month =
    Number(search.month) || current.month;

  if (
    month < 1 ||
    month > 12 ||
    year < 2000 ||
    year > 2100
  ) {
    notFound();
  }

  const performance =
    await getBatchPerformance(
      batchId,
      year,
      month
    );

  const days = getDaysInMonth(
    year,
    month
  );

  const students =
    performance.students.map((student) => ({
      id: student.id,
      name: student.name,
    }));

  return (
    <main className="mx-auto min-w-0 w-full max-w-[1800px] overflow-x-hidden p-2 sm:p-3">
      <div className="flex min-w-0 flex-col gap-6">
        {/* HEADER */}

        <div className="flex min-w-0 flex-col gap-4">
          <BatchPerformanceHeader
            batchName={performance.batch.name}
          />

          <div className="flex w-full justify-end">
            <BatchPerformanceMonthControls
              year={year}
              month={month}
            />
          </div>
        </div>

        {/* BATCH ATTENDANCE TAKEN */}

        <BatchAttendanceTakenTable
          days={performance.attendanceTaken}
        />

        {/* TEACHER ATTENDANCE */}

        <TeacherAttendanceTable
          teachers={performance.teachers}
          days={days}
        />

        {/* STUDENT ATTENDANCE */}

        <StudentAttendanceTable
          students={performance.students}
          days={days}
        />

        {/* STUDENT PROGRESS */}

        <BatchStudentProgress
          students={students}
          batchId={batchId}
          year={year}
          month={month}
        />
      </div>
    </main>
  );
}