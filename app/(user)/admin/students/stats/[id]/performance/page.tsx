import { notFound } from "next/navigation";

import { requireRole } from "@/lib/auth/require-role";

import {
  getStudentPerformance,
} from "@/app/ServerActions/studentPerformance/queries";

import StudentPerformanceHeader from "@/components/StudentPerformance/StudentPerformanceHeader";
import StudentPerformanceMonthControls from "@/components/StudentPerformance/StudentPerformanceMonthControls";
import StudentAttendanceTables from "@/components/StudentPerformance/StudentAttendanceTables";
import StudentMonthProgressTable from "@/components/StudentPerformance/StudentMonthProgressTable";

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

export default async function StudentPerformancePage({
  params,
  searchParams,
}: Props) {
  await requireRole("ADMIN","TEACHER","STUDENT");

  const { id } = await params;
  const search = await searchParams;

  const current = getCurrentMonth();

  const year = Number(search.year) || current.year;
  const month = Number(search.month) || current.month;

  if (
    month < 1 ||
    month > 12 ||
    year < 2000 ||
    year > 2100
  ) {
    notFound();
  }

  const performance = await getStudentPerformance(
    id,
    year,
    month,
  );

  return (
    <main className="mx-auto min-w-0 w-full max-w-[1800px] p-4 sm:p-6">
      <div className="flex min-w-0 flex-col gap-6">
        {/* HEADER */}

        <div className="flex min-w-0 flex-col gap-4">
          <StudentPerformanceHeader
            studentName={performance.student.name}
            isAdmin={true}
            studentId={id}
            year={year}
            month={month}
          />

          <div className="flex w-full justify-end">
            <StudentPerformanceMonthControls
              year={year}
              month={month}
            />
          </div>
        </div>

        {/* ATTENDANCE */}

        <StudentAttendanceTables
          attendance={performance.attendance}
        />

        {/* PROGRESS */}

        <StudentMonthProgressTable
          key={`${id}-${year}-${month}`}
          studentId={id}
          year={year}
          month={month}
          batches={performance.batches}
        />
      </div>
    </main>
  );
}