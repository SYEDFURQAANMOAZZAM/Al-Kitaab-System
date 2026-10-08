import { buildTocReport } from "./buildTocReport";

export async function getSubjectTocReportService({
  studentIds,
  subjectId,
  month,
}: {
  studentIds: string[];
  subjectId: string;
  month?: string;
}) {
  if (studentIds.length === 0) {
    return [];
  }

  return buildTocReport({
    studentIds,
    subjectIds: [subjectId],
    month: month?.trim() || undefined,
  });
}