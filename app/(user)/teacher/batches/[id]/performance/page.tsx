import { notFound } from "next/navigation";

import { requireTeacherBatchAccess } from "@/lib/auth/require-teacher-batch";
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
    id: string;
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

function getDaysInMonth(year: number, month: number) {
  const count = new Date(
    Date.UTC(year, month, 0),
  ).getUTCDate();

  return Array.from({ length: count }, (_, index) => {
    const date = new Date(
      Date.UTC(year, month - 1, index + 1),
    );

    return date.toISOString().slice(0, 10);
  });
}

export default async function BatchPerformancePage({
  params,
  searchParams,
}: Props) {
  const { id } = await params;
  const search = await searchParams;

  await requireTeacherBatchAccess(id);

  const current = getCurrentMonth();

  const year = Number(search.year) || current.year;
  const month = Number(search.month) || current.month;

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

  const performance = await getLiveBatchPerformance(
    id,
    year,
    month,
  );

  const days = getDaysInMonth(year, month);

  const students = performance.students.map((student) => ({
    id: student.id,
    name: student.name,
  }));

  return (
    <main className="mx-auto min-w-0 w-full max-w-[1800px] overflow-x-hidden p-2 sm:p-3">
      <div className="flex min-w-0 flex-col gap-6">
        <div className="flex min-w-0 flex-col gap-4">
          <BatchPerformanceHeader
            batchName={performance.batch.name}
            batchId={id}
            year={year}
            month={month}
          />

          <div className="flex w-full justify-end">
            <BatchPerformanceMonthControls
              year={year}
              month={month}
            />
          </div>
        </div>

        <BatchAttendanceTakenTable
          days={performance.attendanceTaken}
        />

        <TeacherAttendanceTable
          teachers={performance.teachers}
          days={days}
        />

        <StudentAttendanceTable
          students={performance.students}
          days={days}
        />

        <BatchStudentProgress
          students={students}
          batchId={id}
          year={year}
          month={month}
        />
      </div>
    </main>
  );
}