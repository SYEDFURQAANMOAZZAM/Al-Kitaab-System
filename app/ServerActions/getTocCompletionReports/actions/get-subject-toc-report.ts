"use server";

import { requireRoleForAction } from "@/lib/auth/require-role";

import { getSubjectTocReportService } from "../service/getSubjectTocReport.service";

export async function getSubjectTocReport({
  studentIds,
  subjectId,
  month,
}: {
  studentIds: string[];
  subjectId: string;
  month?: string;
}) {
  await requireRoleForAction(["ADMIN"]);

  return getSubjectTocReportService({
    studentIds,
    subjectId,
    month,
  });
}