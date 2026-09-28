"use server";

import { requireRoleForAction } from "@/lib/auth/require-role";

import { getStudentTocReportService } from "../service/studentTocReport.service";

export async function getStudentTocReport({
  month,
}: {
  month?: string;
} = {}) {
  const session =
    await requireRoleForAction([
      "ADMIN",
      "TEACHER",
      "STUDENT",
    ]);

  return getStudentTocReportService({
    userId: session.id,
    month,
  });
}