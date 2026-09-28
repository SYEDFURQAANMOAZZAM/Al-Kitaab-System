"use server";

import { requireRoleForAction } from "@/lib/auth/require-role";

import { getTeacherTocReportService } from "../service/teacherTocReport.service";

export async function getTeacherTocReport({
  batchIds = [],
  subjectIds = [],
  page = 1,
  search = "",
  month,
}: {
  batchIds?: string[];
  subjectIds?: string[];
  page?: number;
  search?: string;
  month?: string;
}) {
  const session =
    await requireRoleForAction([
      "TEACHER",
    ]);

  return getTeacherTocReportService({
    teacherUserId: session.id,
    batchIds,
    subjectIds,
    page,
    search,
    month,
  });
}