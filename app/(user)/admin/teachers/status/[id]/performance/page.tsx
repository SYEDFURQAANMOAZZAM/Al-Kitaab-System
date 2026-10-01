import TeacherPerformance from "@/components/TeacherPerformance/TeacherPerformance";
import { getTeacherPerformance } from "@/app/ServerActions/TeacherPerformance/queries";
import type { TeacherPerformanceData } from "@/app/ServerActions/TeacherPerformance/types";
import {requireRole} from "@/lib/auth/require-role";
type PageProps = {
  params: Promise<{
    id: string;
  }>;
  searchParams: Promise<{
    month?: string;
    year?: string;
  }>;
};

function getCurrentIndiaPeriod() {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "numeric",
  }).formatToParts(new Date());

  return {
    month: Number(
      parts.find((part) => part.type === "month")?.value
    ),
    year: Number(
      parts.find((part) => part.type === "year")?.value
    ),
  };
}

function getEmptyPerformance(
  teacherId: string
): TeacherPerformanceData {
  return {
    teacherId,
    teacherName: "Teacher",
    batches: [],
    attendance: [],
    leaves: 0,
    presentDays: 0,
    absentDays: 0,
    totalDays: 0,
  };
}

function isValidPerformance(
  data: unknown
): data is TeacherPerformanceData {
  if (!data || typeof data !== "object") {
    return false;
  }

  const result = data as Partial<TeacherPerformanceData>;

  return (
    typeof result.teacherId === "string" &&
    typeof result.teacherName === "string" &&
    Array.isArray(result.batches) &&
    Array.isArray(result.attendance) &&
    typeof result.leaves === "number" &&
    typeof result.presentDays === "number" &&
    typeof result.absentDays === "number" &&
    typeof result.totalDays === "number"
  );
}

export default async function TeacherPerformancePage({
  params,
  searchParams,
}: PageProps) {
  await requireRole("ADMIN","TEACHER")
  const [{ id }, query] = await Promise.all([
    params,
    searchParams,
  ]);

  const current = getCurrentIndiaPeriod();

  const requestedMonth = Number(query.month);
  const requestedYear = Number(query.year);

  const month =
    Number.isInteger(requestedMonth) &&
    requestedMonth >= 1 &&
    requestedMonth <= 12
      ? requestedMonth
      : current.month;

  const year =
    Number.isInteger(requestedYear) &&
    requestedYear >= current.year - 9 &&
    requestedYear <= current.year
      ? requestedYear
      : current.year;

  let data: TeacherPerformanceData = getEmptyPerformance(id);

  try {
    const result = await getTeacherPerformance(id, month, year);

    if (isValidPerformance(result)) {
      data = result;
    } else {
      console.warn(
        `Teacher performance query returned invalid or empty data for teacher ${id}`
      );
    }
  } catch (error) {
    console.error(
      `Failed to load teacher performance for teacher ${id}:`,
      error
    );
  }

  return (
    <TeacherPerformance
      data={data}
      month={month}
      year={year}
    />
  );
}