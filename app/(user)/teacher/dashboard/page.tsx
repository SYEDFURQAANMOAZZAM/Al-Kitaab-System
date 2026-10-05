import { prisma } from "@/lib/prisma";

import { requireRole } from "@/lib/auth/require-role";

import { getTeacherDashboardAction } from "@/app/ServerActions/TeacherDashboard/action";

import { TeacherDashboard } from "./TeacherDashboard";

type PageProps = {
  searchParams: Promise<{
    month?: string;
    year?: string;
  }>;
};

export default async function TeacherDashboardPage({
  searchParams,
}: PageProps) {
  const params = await searchParams;

  const now = new Date();

  const parsedMonth = Number(params.month);
  const parsedYear = Number(params.year);

  const month =
    Number.isInteger(parsedMonth) &&
    parsedMonth >= 1 &&
    parsedMonth <= 12
      ? parsedMonth
      : now.getMonth() + 1;

  const year =
    Number.isInteger(parsedYear) &&
    parsedYear >= 2000 &&
    parsedYear <= 2100
      ? parsedYear
      : now.getFullYear();

  /**
   * Authentication.
   *
   * This also gives us the authenticated user's ID.
   */
  const user = await requireRole("TEACHER");

  /**
   * Get only batches assigned to the authenticated teacher.
   *
   * No batch IDs come from the browser.
   */
  const teacher = await prisma.teacher.findUnique({
    where: {
      userId: user.id,
    },

    select: {
      assignments: {
        select: {
          batchId: true,
        },
      },
    },
  });

  if (!teacher) {
    throw new Error("Teacher profile not found");
  }

  const batchIds = teacher.assignments.map(
    (assignment) => assignment.batchId,
  );

  /**
   * The action performs its own authentication +
   * authorization check as defense-in-depth.
   */
  const dashboard =
    await getTeacherDashboardAction({
      batchIds,
      month,
      year,
    });

  return (
    <TeacherDashboard
      dashboard={dashboard}
      month={month}
      year={year}
    />
  );
}